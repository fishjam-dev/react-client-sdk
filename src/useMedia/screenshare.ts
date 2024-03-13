import { DeviceError, DeviceState } from "../types";

export type UseScreenshareAction =
  | { type: "UseScreenshare-loading" }
  | {
      type: "UseScreenshare-setScreenshare";
      data: DeviceState;
    }
  | { type: "UseScreenshare-setError"; error: DeviceError | null }
  | { type: "UseScreenshare-stop" }
  | { type: "UseScreenshare-setEnable"; enabled: boolean };

export type UseScreenShareState = {
  screenshare: DeviceState | null;
};
