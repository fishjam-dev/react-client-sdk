export type AudioOrVideoType = "audio" | "video";
export type Type = "audio" | "video" | "screenshare";

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
