import {
  AudioOrVideoType,
  CurrentDevices,
  DeviceError,
  DevicePersistence,
  DeviceReturnType,
  DeviceState,
  Errors,
  GetMedia,
  InitMediaConfig,
  Media,
  parseError,
  UseUserMediaConfig,
  UseUserMediaStartConfig,
  UseUserMediaState,
} from "./types";

import { loadObject, saveObject } from "./localStorage";
import {
  getExactDeviceConstraint,
  prepareConstraints,
  prepareMediaTrackConstraints,
  toMediaTrackConstraints,
} from "./constraints";

import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { TrackType } from "./ScreenShareManager";
import { ClientApiState } from "./Client";

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

export type DeviceManagerEvents = {
  managerStarted: (arg: any) => void;
  managerInitialized: (event: { audio?: DeviceState; video?: DeviceState }) => void;
  deviceReady: (event: { type: TrackType; stream: MediaStream }) => void;
  devicesReady: (arg: any) => void;
  deviceStopped: (arg: any) => void;
  deviceEnabled: (arg: any) => void;
  deviceDisabled: (arg: any) => void;
  error: (arg: any) => void;
};

export class DeviceManager extends (EventEmitter as new () => TypedEmitter<DeviceManagerEvents>) {
  private readonly defaultConfig?: UseUserMediaConfig;
  private readonly devicePersistence: DevicePersistence;
  private skip: boolean = false;
  private readonly audioConstraints: MediaTrackConstraints | undefined;
  private readonly videoConstraints: MediaTrackConstraints | undefined;

  public video: DeviceState = {
    status: "Not requested",
    media: null,
    devices: null,
    error: null,
  };

  public audio: DeviceState = {
    status: "Not requested",
    media: null,
    devices: null,
    error: null,
  };

  public getSnapshot(): UseUserMediaState {
    return { video: this.video, audio: this.audio };
  }

  constructor(defaultConfig?: UseUserMediaConfig) {
    super();
    this.defaultConfig = defaultConfig;

    if (defaultConfig?.storage === undefined || defaultConfig?.storage === false) {
      this.devicePersistence = {
        getLastVideoDevice: null,
        getLastAudioDevice: null,
        saveLastAudioDevice: () => {},
        saveLastVideoDevice: () => {},
      };
    } else if (defaultConfig?.storage === true) {
      this.devicePersistence = LOCAL_STORAGE_DEVICE_PERSISTENCE;
    } else {
      this.devicePersistence = defaultConfig?.storage;
    }

    this.audioConstraints = defaultConfig?.audioTrackConstraints
      ? toMediaTrackConstraints(defaultConfig.audioTrackConstraints)
      : undefined;
    this.videoConstraints = defaultConfig?.videoTrackConstraints
      ? toMediaTrackConstraints(defaultConfig.videoTrackConstraints)
      : undefined;
  }

  public async init(config?: InitMediaConfig) {
    // todo implement storage
    // todo implement start on mount
    console.log({ name: "Device manager init fn", config });

    if (this.skip) return;
    this.skip = true;
    if (!navigator?.mediaDevices) throw Error("Navigator is available only in secure contexts");

    const { getLastAudioDevice, saveLastAudioDevice, getLastVideoDevice, saveLastVideoDevice } = this.devicePersistence;

    const videoTrackConstraints = config?.videoTrackConstraints ?? this.defaultConfig?.videoTrackConstraints;
    const audioTrackConstraints = config?.audioTrackConstraints ?? this.defaultConfig?.audioTrackConstraints;

    const previousVideoDevice: MediaDeviceInfo | null = getLastVideoDevice?.() ?? null;
    const previousAudioDevice: MediaDeviceInfo | null = getLastAudioDevice?.() ?? null;

    const shouldAskForVideo = !!videoTrackConstraints;
    const shouldAskForAudio = !!audioTrackConstraints;

    // from reducer:
    const action1 = {
      type: "UseUserMedia-loading" as const,
      video: { ask: shouldAskForVideo, constraints: this.videoConstraints },
      audio: { ask: shouldAskForAudio, constraints: this.audioConstraints },
    };

    const videoConstraints = action1.video.constraints;
    const audioConstraints = action1.audio.constraints;

    this.video.status = shouldAskForVideo && videoConstraints ? REQUESTING : this.video.status ?? NOT_REQUESTED;
    this.audio.status = shouldAskForAudio && audioConstraints ? REQUESTING : this.audio.status ?? NOT_REQUESTED;

    // this.dispatch(action1);
    console.log("Emitting event managerStarted from DeviceManager");

    this.emit("managerStarted", action1);

    let requestedDevices: MediaStream | null = null;
    const constraints = {
      video: shouldAskForVideo && getExactDeviceConstraint(this.videoConstraints, previousVideoDevice?.deviceId),
      audio: shouldAskForAudio && getExactDeviceConstraint(this.audioConstraints, previousAudioDevice?.deviceId),
    };

    let result: GetMedia = await getMedia(constraints, {});

    if (result.type === "Error" && result.error?.name === "OverconstrainedError") {
      result = await handleOverconstrainedError(constraints);
    }

    if (result.type === "Error" && result.error?.name === "NotAllowedError") {
      result = await handleNotAllowedError(result.constraints);
    }

    const mediaDeviceInfos: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

    if (result.type === "OK") {
      requestedDevices = result.stream;
      // Safari changes deviceId between sessions, therefore we cannot rely on deviceId for identification purposes.
      // We can switch a random device that comes from safari to one that has the same label as the one used in the previous session.
      const currentDevices = getCurrentDevicesSettings(requestedDevices, mediaDeviceInfos);
      const shouldCorrectDevices = isAnyDeviceDifferentFromLastSession(
        previousVideoDevice,
        previousAudioDevice,
        currentDevices,
      );
      if (shouldCorrectDevices) {
        const videoIdToStart = mediaDeviceInfos.find((info) => info.label === previousVideoDevice?.label)?.deviceId;
        const audioIdToStart = mediaDeviceInfos.find((info) => info.label === previousAudioDevice?.label)?.deviceId;

        if (videoIdToStart || audioIdToStart) {
          stopTracks(requestedDevices);

          const exactConstraints: MediaStreamConstraints = {
            video: !!result.constraints.video && prepareConstraints(videoIdToStart, this.videoConstraints),
            audio: !!result.constraints.video && prepareConstraints(audioIdToStart, this.audioConstraints),
          };

          const correctedResult = await getMedia(exactConstraints, result.previousErrors);

          if (correctedResult.type === "OK") {
            requestedDevices = correctedResult.stream;
          } else {
            console.error("Device Manager unexpected error");
          }
        }
      }
    }

    const video: DeviceState = prepareDeviceState(
      requestedDevices,
      requestedDevices?.getVideoTracks()[0] || null,
      mediaDeviceInfos.filter(isVideo),
      getError(result, "video"),
      shouldAskForVideo,
    );

    const audio: DeviceState = prepareDeviceState(
      requestedDevices,
      requestedDevices?.getAudioTracks()[0] || null,
      mediaDeviceInfos.filter(isAudio),
      getError(result, "audio"),
      shouldAskForAudio,
    );

    this.video = video;
    this.audio = audio;

    if (video.media?.deviceInfo) {
      saveLastVideoDevice?.(video.media.deviceInfo);
    }

    if (audio.media?.deviceInfo) {
      saveLastAudioDevice?.(audio.media?.deviceInfo);
    }

    console.log("Emitting event managerInitialized from Device Manager");
    this.emit("managerInitialized", { audio, video });
  }

  public async start({ audioDeviceId, videoDeviceId }: UseUserMediaStartConfig) {
    const shouldRestartVideo = !!videoDeviceId && videoDeviceId !== this.video.media?.deviceInfo?.deviceId;
    const shouldRestartAudio = !!audioDeviceId && audioDeviceId !== this.audio.media?.deviceInfo?.deviceId;

    const newVideoDevice =
      videoDeviceId === true ? this.devicePersistence.getLastVideoDevice?.()?.deviceId || true : videoDeviceId;
    const newAudioDevice =
      audioDeviceId === true ? this.devicePersistence.getLastAudioDevice?.()?.deviceId || true : audioDeviceId;

    const exactConstraints: MediaStreamConstraints = {
      video: shouldRestartVideo && prepareMediaTrackConstraints(newVideoDevice, this.videoConstraints),
      audio: shouldRestartAudio && prepareMediaTrackConstraints(newAudioDevice, this.audioConstraints),
    };

    if (!exactConstraints.video && !exactConstraints.audio) return;

    const result = await getMedia(exactConstraints, {});

    if (result.type === "OK") {
      const stream = result.stream;

      const currentVideoDeviceId = result.stream.getVideoTracks()?.[0]?.getSettings()?.deviceId;
      const videoInfo = currentVideoDeviceId ? getDeviceInfo(currentVideoDeviceId, this.video.devices ?? []) : null;
      if (videoInfo) {
        this.devicePersistence.saveLastVideoDevice?.(videoInfo);
      }

      const currentAudioDeviceId = result.stream.getAudioTracks()?.[0]?.getSettings()?.deviceId;
      const audioInfo = currentAudioDeviceId ? getDeviceInfo(currentAudioDeviceId, this.audio.devices ?? []) : null;

      if (audioInfo) {
        this.devicePersistence.saveLastAudioDevice?.(audioInfo);
      }

      // form reducer:

      const action = {
        type: "UseUserMedia-setMedia" as const,
        stream: stream,
        video: {
          restart: shouldRestartVideo,
          info: videoInfo,
        },
        audio: {
          restart: shouldRestartAudio,
          info: audioInfo,
        },
      };

      if (action.video.restart) {
        this.video?.media?.track?.stop();
      }

      if (action.audio.restart) {
        this.audio?.media?.track?.stop();
      }

      const videoMedia: Media | null = action.video.restart
        ? {
            stream: action.stream,
            track: action.stream.getVideoTracks()[0] || null,
            deviceInfo: action.video.info,
            enabled: true,
          }
        : this.video.media;

      const audioMedia: Media | null = action.audio.restart
        ? {
            stream: action.stream,
            track: action.stream.getAudioTracks()[0] || null,
            deviceInfo: action.audio.info,
            enabled: true,
          }
        : this.audio.media;

      this.video.media = videoMedia;
      this.audio.media = audioMedia;

      this.emit("devicesReady", action);
    } else {
      const parsedError = result.error;
      const action = { type: "UseUserMedia-setError" as const, parsedError, constraints: exactConstraints };

      const videoError = action.constraints.video ? action.parsedError : this.video.error;
      const audioError = action.constraints.audio ? action.parsedError : this.audio.error;

      this.video.error = videoError;
      this.audio.error = audioError;

      this.emit("error", action);
    }
  }

  public async stop(type: AudioOrVideoType) {
    const action = { type: "UseUserMedia-stopDevice" as const, mediaType: type };

    this[type].media?.track?.stop();
    this[type].media = null;

    this.emit("deviceStopped", action);
  }

  public setEnable(type: AudioOrVideoType, value: boolean) {
    if (!this[type].media || !this[type].media?.track) {
      return;
    }

    this[type!].media!.track!.enabled = value;
    this[type!].media!.enabled = value;

    if (value) {
      this.emit("deviceEnabled", value);
    } else {
      this.emit("deviceDisabled", value);
    }
  }
}
