import {
  AudioOrVideoType,
  CurrentDevices,
  DeviceError,
  DevicePersistence,
  DeviceReturnType,
  DeviceState,
  Errors,
  GetMedia,
  UseUserMediaState,
} from "../types";
import { loadObject, saveObject } from "../localStorage";

const removeExact = (
  trackConstraints: boolean | MediaTrackConstraints | undefined,
): boolean | MediaTrackConstraints | undefined => {
  if (typeof trackConstraints === "object") {
    const copy: MediaTrackConstraints = { ...trackConstraints };
    delete copy["deviceId"];
    return copy;
  }
  return trackConstraints;
};

const REQUESTING = "Requesting";
const NOT_REQUESTED = "Not requested";
const PERMISSION_DENIED: DeviceError = { name: "NotAllowedError" };
const OVERCONSTRAINED_ERROR: DeviceError = { name: "OverconstrainedError" };

const isVideo = (device: MediaDeviceInfo) => device.kind === "videoinput";
const isAudio = (device: MediaDeviceInfo) => device.kind === "audioinput";

const getDeviceInfo = (trackDeviceId: string | null, devices: MediaDeviceInfo[]): MediaDeviceInfo | null =>
  (trackDeviceId && devices.find(({ deviceId }) => trackDeviceId === deviceId)) || null;

const getCurrentDevicesSettings = (
  requestedDevices: MediaStream,
  mediaDeviceInfos: MediaDeviceInfo[],
): CurrentDevices => {
  const currentDevices: CurrentDevices = { videoinput: null, audioinput: null };

  for (const track of requestedDevices.getTracks()) {
    const settings = track.getSettings();
    if (settings.deviceId) {
      const currentDevice = mediaDeviceInfos.find((device) => device.deviceId == settings.deviceId);
      const kind = currentDevice?.kind ?? null;
      if ((currentDevice && kind === "videoinput") || kind === "audioinput") {
        currentDevices[kind] = currentDevice ?? null;
      }
    }
  }
  return currentDevices;
};

const isDeviceDifferentFromLastSession = (lastDevice: MediaDeviceInfo | null, currentDevice: MediaDeviceInfo | null) =>
  lastDevice && (currentDevice?.deviceId !== lastDevice.deviceId || currentDevice?.label !== lastDevice?.label);

const isAnyDeviceDifferentFromLastSession = (
  lastVideoDevice: MediaDeviceInfo | null,
  lastAudioDevice: MediaDeviceInfo | null,
  currentDevices: CurrentDevices | null,
): boolean =>
  !!(
    (currentDevices?.videoinput &&
      isDeviceDifferentFromLastSession(lastVideoDevice, currentDevices?.videoinput || null)) ||
    (currentDevices?.audioinput &&
      isDeviceDifferentFromLastSession(lastAudioDevice, currentDevices?.audioinput || null))
  );

// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
// OverconstrainedError has higher priority than NotAllowedError
export const parseError = (error: unknown): DeviceError | null => {
  if (error && typeof error === "object" && "name" in error) {
    if (error.name === "NotAllowedError") {
      return PERMISSION_DENIED;
    } else if (error.name === "OverconstrainedError") {
      return OVERCONSTRAINED_ERROR;
    }
  }
  // todo handle unknown error
  return null;
};

const stopTracks = (requestedDevices: MediaStream) => {
  for (const track of requestedDevices.getTracks()) {
    track.stop();
  }
};

const getMedia = async (constraints: MediaStreamConstraints, previousErrors: Errors): Promise<GetMedia> => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream: mediaStream, type: "OK", constraints, previousErrors };
  } catch (error: unknown) {
    const parsedError: DeviceError | null = parseError(error);
    return { error: parsedError, type: "Error", constraints };
  }
};

const handleOverconstrainedError = async (constraints: MediaStreamConstraints): Promise<GetMedia> => {
  const videoResult = await getMedia({ video: removeExact(constraints.video), audio: constraints.audio }, {});
  if (videoResult.type === "OK" || videoResult.error?.name === "NotAllowedError") {
    return videoResult;
  }

  const audioResult = await getMedia({ video: constraints.video, audio: removeExact(constraints.audio) }, {});
  if (audioResult.type === "OK" || audioResult.error?.name === "NotAllowedError") {
    return audioResult;
  }

  return await getMedia({ video: removeExact(constraints.video), audio: removeExact(constraints.audio) }, {});
};

const handleNotAllowedError = async (constraints: MediaStreamConstraints): Promise<GetMedia> => {
  const videoResult = await getMedia({ video: false, audio: constraints.audio }, { video: PERMISSION_DENIED });
  if (videoResult.type === "OK") {
    return videoResult;
  }

  const audioResult = await getMedia({ video: constraints.video, audio: false }, { audio: PERMISSION_DENIED });
  if (audioResult.type === "OK") {
    return audioResult;
  }

  return await getMedia({ video: false, audio: false }, { video: PERMISSION_DENIED, audio: PERMISSION_DENIED });
};

const getError = (result: GetMedia, type: AudioOrVideoType): DeviceError | null => {
  if (result.type === "OK") {
    return result.previousErrors[type] || null;
  }
  return PERMISSION_DENIED;
};

const prepareStatus = (
  requested: boolean,
  track: MediaStreamTrack | null,
  deviceError: DeviceError | null,
): [DeviceReturnType, DeviceError | null] => {
  if (!requested) return ["Not requested", null];
  if (track) return ["OK", null];
  if (deviceError) return ["Error", deviceError];
  return ["Error", null];
};

const prepareDeviceState = (
  stream: MediaStream | null,
  track: MediaStreamTrack | null,
  devices: MediaDeviceInfo[],
  error: DeviceError | null,
  shouldAskForVideo: boolean,
) => {
  const deviceInfo = getDeviceInfo(track?.getSettings()?.deviceId || null, devices);
  const [status, newError] = prepareStatus(shouldAskForVideo, track, error);

  return {
    devices,
    status,
    media: {
      stream: track ? stream : null,
      track: track,
      deviceInfo,
      enabled: !!track,
    },
    error: error ?? newError,
  };
};

const LOCAL_STORAGE_VIDEO_DEVICE_KEY = "last-selected-video-device";
const LOCAL_STORAGE_AUDIO_DEVICE_KEY = "last-selected-audio-device";
const LOCAL_STORAGE_DEVICE_PERSISTENCE: DevicePersistence = {
  getLastAudioDevice: () => loadObject<MediaDeviceInfo | null>(LOCAL_STORAGE_AUDIO_DEVICE_KEY, null),
  saveLastAudioDevice: (info: MediaDeviceInfo) => saveObject<MediaDeviceInfo>(LOCAL_STORAGE_AUDIO_DEVICE_KEY, info),
  getLastVideoDevice: () => loadObject<MediaDeviceInfo | null>(LOCAL_STORAGE_VIDEO_DEVICE_KEY, null),
  saveLastVideoDevice: (info: MediaDeviceInfo) => saveObject<MediaDeviceInfo>(LOCAL_STORAGE_VIDEO_DEVICE_KEY, info),
};

export const INITIAL_STATE: UseUserMediaState = {
  video: {
    status: "Not requested",
    media: null,
    devices: null,
    error: null,
  },
  audio: {
    status: "Not requested",
    media: null,
    devices: null,
    error: null,
  },
};

export type UseUserMediaAction =
  | {
      type: "UseUserMedia-loading";
      video: { ask: boolean; constraints: MediaTrackConstraints | undefined };
      audio: { ask: boolean; constraints: MediaTrackConstraints | undefined };
    }
  | {
      type: "UseUserMedia-setAudioAndVideo";
      video: DeviceState;
      audio: DeviceState;
    }
  | {
      type: "UseUserMedia-setMedia";
      stream: MediaStream;
      audio: { restart: boolean; info: MediaDeviceInfo | null };
      video: { restart: boolean; info: MediaDeviceInfo | null };
    }
  | { type: "UseUserMedia-setError"; parsedError: DeviceError | null; constraints: MediaStreamConstraints }
  | { type: "UseUserMedia-stopDevice"; mediaType: AudioOrVideoType }
  | { type: "UseUserMedia-setEnable"; mediaType: AudioOrVideoType; value: boolean };
