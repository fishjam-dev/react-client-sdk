import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { DeviceError, DeviceReturnType, Media, parseError } from "./types";

export type TrackType = "audio" | "video" | "audiovideo";

export type DisplayMediaManagerEvents = {
  deviceReady: (event: { type: TrackType }, state: ScreenShareDeviceState) => void;
  deviceStopped: (event: { type: TrackType }, state: ScreenShareDeviceState) => void;
  deviceEnabled: (event: { type: TrackType }, state: ScreenShareDeviceState) => void;
  deviceDisabled: (event: { type: TrackType }, state: ScreenShareDeviceState) => void;
  error: (
    event: {
      type: TrackType;
      error: DeviceError | null;
      rawError: any;
    },
    state: ScreenShareDeviceState,
  ) => void;
};

export interface StartScreenShareConfig {
  audioTrackConstraints?: boolean | MediaTrackConstraints;
  videoTrackConstraints?: boolean | MediaTrackConstraints;
}

export type ScreenShareMedia = {
  stream: MediaStream | null;
  track: MediaStreamTrack | null;
  enabled: boolean;
};

export type ScreenShareDeviceState = {
  status: DeviceReturnType;
  audioMedia: ScreenShareMedia | null;
  videoMedia: ScreenShareMedia | null;
  error: DeviceError | null;
};

export class ScreenShareManager extends (EventEmitter as new () => TypedEmitter<DisplayMediaManagerEvents>) {
  private defaultConfig?: StartScreenShareConfig;

  private data: ScreenShareDeviceState = {
    audioMedia: null,
    videoMedia: null,
    status: "Not requested",
    error: null,
  };

  // todo add nested read only
  public getSnapshot(): ScreenShareDeviceState {
    return this.data;
  }

  constructor(defaultConfig?: StartScreenShareConfig) {
    super();
    this.defaultConfig = defaultConfig;
  }

  public setConfig(config: StartScreenShareConfig) {
    this.defaultConfig = config;
  }

  private getType(options: DisplayMediaStreamOptions): TrackType | null {
    if (options.audio && options.video) return "audiovideo";
    if (options.audio) return "audio";
    if (options.video) return "video";
    return null;
  }

  public async start(config?: StartScreenShareConfig) {
    const options: DisplayMediaStreamOptions = {
      video: config?.videoTrackConstraints ?? this.defaultConfig?.videoTrackConstraints ?? undefined,
      audio: config?.audioTrackConstraints ?? this.defaultConfig?.audioTrackConstraints ?? undefined,
    };

    const type = this.getType(options);
    if (!type) return;

    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia(options);

      const data: ScreenShareDeviceState = {
        error: null,
        videoMedia: {
          enabled: true,
          stream: newStream,
          track: newStream?.getVideoTracks()[0] ?? null,
        },
        audioMedia: {
          enabled: true,
          stream: newStream,
          track: newStream?.getAudioTracks()[0] ?? null,
        },
        status: "OK",
      };
      if (data.videoMedia?.track) {
        data.videoMedia.track.addEventListener("ended", (event) => {
          this.stop("video");
        });
      }
      if (data.audioMedia?.track) {
        data.audioMedia.track.addEventListener("ended", (event) => {
          this.stop("audio");
        });
      }
      this.data = data;
      this.emit("deviceReady", { type: type }, this.data);
    } catch (error: unknown) {
      const parsedError: DeviceError | null = parseError(error);
      this.emit("error", { type, error: parsedError, rawError: error }, this.data);
    }
  }

  public async stop(type: TrackType) {
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

  public setEnable(type: TrackType, value: boolean) {
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

    // todo should event be emitted if nothing changes?
    if (value) {
      this.emit("deviceEnabled", { type }, this.data);
    } else {
      this.emit("deviceDisabled", { type }, this.data);
    }
  }
}
