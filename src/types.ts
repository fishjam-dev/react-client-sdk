import { Track } from "@jellyfish-dev/react-client-sdk";
import { SimulcastConfig, TrackBandwidthLimit } from "@jellyfish-dev/ts-client-sdk";
import { StartScreenShareConfig } from "./ScreenShareManager";

export type AudioOrVideoType = "audio" | "video";

export type DeviceReturnType = "OK" | "Error" | "Not requested" | "Requesting";

export type Media = {
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  enabled: boolean;
  deviceInfo: MediaDeviceInfo | null;
};

export type DeviceState = {
  status: DeviceReturnType;
  media: Media | null;
  error: DeviceError | null;
  devices: MediaDeviceInfo[] | null;
};

export type UseUserMediaState = {
  video: DeviceState;
  audio: DeviceState;
};

export type InitMediaConfig = {
  videoTrackConstraints: boolean | MediaTrackConstraints;
  audioTrackConstraints: boolean | MediaTrackConstraints;
};

export type UseUserMediaConfig = {
  videoTrackConstraints: boolean | MediaTrackConstraints;
  audioTrackConstraints: boolean | MediaTrackConstraints;
  startOnMount?: boolean;
  storage?: boolean | DevicePersistence;
};

export type DevicePersistence = {
  getLastAudioDevice: (() => MediaDeviceInfo | null) | null;
  saveLastAudioDevice: (info: MediaDeviceInfo) => void;
  getLastVideoDevice: (() => MediaDeviceInfo | null) | null;
  saveLastVideoDevice: (info: MediaDeviceInfo) => void;
};

export type UseUserMediaStartConfig = {
  audioDeviceId?: string | boolean;
  videoDeviceId?: string | boolean;
};

export type UseUserMedia = {
  data: UseUserMediaState | null;
  start: (config: UseUserMediaStartConfig) => void;
  stop: (type: AudioOrVideoType) => void;
  setEnable: (type: AudioOrVideoType, value: boolean) => void;
  init: () => void;
};

export type DeviceError = { name: "OverconstrainedError" } | { name: "NotAllowedError" };

export type Errors = {
  audio?: DeviceError | null;
  video?: DeviceError | null;
};

export type GetMedia =
  | { stream: MediaStream; type: "OK"; constraints: MediaStreamConstraints; previousErrors: Errors }
  | { error: DeviceError | null; type: "Error"; constraints: MediaStreamConstraints };

export type CurrentDevices = { videoinput: MediaDeviceInfo | null; audioinput: MediaDeviceInfo | null };

export type UseSetupMediaConfig<TrackMetadata> = {
  camera: {
    /**
     * Determines whether broadcasting should start when the user connects to the server with an active camera stream.
     */
    broadcastOnConnect?: boolean;
    /**
     * Determines whether broadcasting should start when the user initiates the camera and is connected to the server.
     */
    broadcastOnDeviceStart?: boolean;

    trackConstraints: boolean | MediaTrackConstraints;
    defaultTrackMetadata?: TrackMetadata;
    defaultSimulcastConfig?: SimulcastConfig;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
  microphone: {
    /**
     * Determines whether broadcasting should start when the user connects to the server with an active camera stream.
     */
    broadcastOnConnect?: boolean;
    /**
     * Determines whether broadcasting should start when the user initiates the camera and is connected to the server.
     */
    broadcastOnDeviceStart?: boolean;

    trackConstraints: boolean | MediaTrackConstraints;
    defaultTrackMetadata?: TrackMetadata;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
  screenShare: {
    /**
     * Determines whether broadcasting should start when the user connects to the server with an active camera stream.
     */
    broadcastOnConnect?: boolean;
    /**
     * Determines whether broadcasting should start when the user initiates the camera and is connected to the server.
     */
    broadcastOnDeviceStart?: boolean;

    streamConfig?: StartScreenShareConfig;

    defaultTrackMetadata?: TrackMetadata;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
  startOnMount?: boolean;
  storage?: boolean | DevicePersistence;
};

export type UseSetupMediaResult = {
  init: () => void;
};

export type UseCameraResult<TrackMetadata> = {
  stop: () => void;
  setEnable: (value: boolean) => void;
  start: (deviceId?: string) => void;
  addTrack: (
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit,
  ) => Promise<string>;
  removeTrack: () => Promise<void>;
  replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) => Promise<void>;
  broadcast: Track<TrackMetadata> | null;
  status: DeviceReturnType | null; // todo how to remove null
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  enabled: boolean;
  deviceInfo: MediaDeviceInfo | null;
  error: DeviceError | null;
  devices: MediaDeviceInfo[] | null;
};

export type UseMicrophoneResult<TrackMetadata> = {
  stop: () => void;
  setEnable: (value: boolean) => void;
  start: (deviceId?: string) => void;
  addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) => Promise<string>;
  removeTrack: () => Promise<void>;
  replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) => Promise<void>;
  broadcast: Track<TrackMetadata> | null;
  status: DeviceReturnType | null;
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  enabled: boolean;
  deviceInfo: MediaDeviceInfo | null;
  error: DeviceError | null;
  devices: MediaDeviceInfo[] | null;
};

export type UseScreenShareResult<TrackMetadata> = {
  stop: () => void;
  setEnable: (value: boolean) => void;
  start: (config?: StartScreenShareConfig) => void;
  addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) => Promise<string>;
  removeTrack: () => Promise<void>;
  replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) => Promise<void>;
  broadcast: Track<TrackMetadata> | null;
  status: DeviceReturnType | null;
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  enabled: boolean;
  error: DeviceError | null;
};

export type UseCameraAndMicrophoneResult<TrackMetadata> = {
  camera: UseCameraResult<TrackMetadata>;
  microphone: UseMicrophoneResult<TrackMetadata>;
  screenShare: UseScreenShareResult<TrackMetadata>;
  init: (config?: UseUserMediaConfig) => void;
  start: (config: UseUserMediaStartConfig) => void;
};

const PERMISSION_DENIED: DeviceError = { name: "NotAllowedError" };
const OVERCONSTRAINED_ERROR: DeviceError = { name: "OverconstrainedError" };

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
