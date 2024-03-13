import { AudioOrVideoType, DeviceError, DeviceState, UseUserMediaState } from "../types";

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
