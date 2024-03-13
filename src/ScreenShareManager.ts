import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { DeviceError, DeviceReturnType, Media, parseError } from "./types";

export type TrackUnion = "audio" | "video" | "both";

export type DisplayMediaManagerEvents = {
  deviceReady: (arg: any) => void;
  deviceStopped: (event: { type: TrackUnion }, state: DeviceState) => void;
  deviceEnabled: (arg: any) => void;
  deviceDisabled: (arg: any) => void;
  error: (arg: any) => void;
};

export interface StartScreenShareConfig {
  audioTrackConstraints: boolean | MediaTrackConstraints;
  videoTrackConstraints: boolean | MediaTrackConstraints;
}

export type DeviceState = {
  status: DeviceReturnType;
  audioMedia: Media | null;
  videoMedia: Media | null;
  error: DeviceError | null;
};

export class ScreenShareManager extends (EventEmitter as new () => TypedEmitter<DisplayMediaManagerEvents>) {
  private readonly defaultConfig?: StartScreenShareConfig;
  private data: DeviceState = {
    audioMedia: null,
    videoMedia: null,
    status: "Not requested",
    error: null,
  };

  // todo add nested read only
  public getSnapshot(): DeviceState {
    return this.data;
  }

  constructor(defaultConfig?: StartScreenShareConfig) {
    super();
    this.defaultConfig = defaultConfig;
  }

  public async start(config?: StartScreenShareConfig) {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: config?.videoTrackConstraints ?? this.defaultConfig?.videoTrackConstraints ?? undefined,
        audio: config?.audioTrackConstraints ?? this.defaultConfig?.audioTrackConstraints ?? undefined,
      });
      const data: DeviceState = {
        // todo remove devices from screenShare
        error: null,
        videoMedia: {
          deviceInfo: null, // todo fix me
          enabled: true,
          stream: newStream,
          track: newStream?.getVideoTracks()[0] ?? null,
        },
        audioMedia: {
          deviceInfo: null, // todo fix me
          enabled: true,
          stream: newStream,
          track: newStream?.getVideoTracks()[0] ?? null,
        },
        status: "OK",
      };
      if (data.videoMedia?.track) {
        data.videoMedia.track.onended = () => stop();
      }
      if (data.audioMedia?.track) {
        data.audioMedia.track.onended = () => stop();
      }
      this.data = data;
      this.emit("deviceReady", data);
    } catch (error: unknown) {
      const parsedError: DeviceError | null = parseError(error);
      this.emit("error", parsedError);
    }
  }

  public async stop(type: TrackUnion) {
    if (type === "video") {
      for (const track of this.data?.videoMedia?.stream?.getTracks() ?? []) {
        track.stop();
      }
      this.data.videoMedia = null;
    } else if (type === "audio") {
      // todo test it
      for (const track of this.data?.audioMedia?.stream?.getTracks() ?? []) {
        track.stop();
      }
      this.data.audioMedia = null;
    } else {
      for (const track of this.data?.videoMedia?.stream?.getTracks() ?? []) {
        track.stop();
      }
      this.data.videoMedia = null;

      for (const track of this.data?.audioMedia?.stream?.getTracks() ?? []) {
        track.stop();
      }
      this.data.audioMedia = null;
    }

    this.emit("deviceStopped", { type }, this.data);
  }

  public setEnable(type: TrackUnion, value: boolean) {
    if (type === "video" && this.data.videoMedia?.track) {
      this.data.videoMedia.track.enabled = value;
      this.data.videoMedia.enabled = value;
    } else if (type === "audio" && this.data.audioMedia?.track) {
      this.data.audioMedia.track.enabled = value;
      this.data.audioMedia.enabled = value;
    } else {
      if (this.data.videoMedia?.track) {
        this.data.videoMedia.track.enabled = value;
        this.data.videoMedia.enabled = value;
      }
      if (this.data.audioMedia?.track) {
        this.data.audioMedia.track.enabled = value;
        this.data.audioMedia.enabled = value;
      }
    }

    if (value) {
      this.emit("deviceEnabled", this.data);
    } else {
      this.emit("deviceDisabled", this.data);
    }
  }
}
