import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import { Endpoint, JellyfishClient, SimulcastConfig, TrackBandwidthLimit } from "../../ts-client-sdk";
import { PeerId, PeerState, State, Track, TrackId, TrackWithOrigin } from "./state.types";
import { Peer, TrackContext } from "@jellyfish-dev/ts-client-sdk";
import { DeviceManager } from "./useUserMedia";
import { UseUserMediaConfig } from "./useUserMedia/types";

export type ClientApiState<PeerMetadata, TrackMetadata> = {
  getSnapshot(): State<PeerMetadata, TrackMetadata>;
  getApi(): any;
};

export interface ClientEvents<PeerMetadata, TrackMetadata> {
  /**
   * Emitted when the websocket connection is closed
   *
   * @param {CloseEvent} event - Close event object from the websocket
   */
  socketClose: (event: CloseEvent, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Emitted when occurs an error in the websocket connection
   *
   * @param {Event} event - Event object from the websocket
   */
  socketError: (event: Event, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Emitted when the websocket connection is opened
   *
   * @param {Event} event - Event object from the websocket
   */
  socketOpen: (event: Event, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when authentication is successful */
  authSuccess: (client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when authentication fails */
  authError: (client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when the connection is closed */
  disconnected: (client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called when peer was accepted.
   */
  joined: (
    event: {
      peerId: string;
      peers: Peer<PeerMetadata, TrackMetadata>[];
    },
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called when peer was not accepted
   * @param metadata - Pass through for client application to communicate further actions to frontend
   */
  joinError: (metadata: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Called when data in a new track arrives.
   *
   * This callback is always called after {@link MessageEvents.trackAdded}.
   * It informs user that data related to the given track arrives and can be played or displayed.
   */
  trackReady: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time the peer which was already in the room, adds new track. Fields track and stream will be set to null.
   * These fields will be set to non-null value in {@link MessageEvents.trackReady}
   */
  trackAdded: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called when some track will no longer be sent.
   *
   * It will also be called before {@link MessageEvents.peerLeft} for each track of this peer.
   */
  trackRemoved: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time peer has its track metadata updated.
   */
  trackUpdated: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time new peer joins the room.
   */
  peerJoined: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time peer leaves the room.
   */
  peerLeft: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time peer has its metadata updated.
   */
  peerUpdated: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called in case of errors related to multimedia session e.g. ICE connection.
   */
  connectionError: (message: string, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called every time the server estimates client's bandiwdth.
   *
   * @param {bigint} estimation - client's available incoming bitrate estimated
   * by the server. It's measured in bits per second.
   */
  bandwidthEstimationChanged: (estimation: bigint, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;

  // track context events
  encodingChanged: (
    context: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Emitted every time an update about voice activity is received from the server.
   */
  voiceActivityChanged: (
    context: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApiState<PeerMetadata, TrackMetadata>,
  ) => void;

  // device manager events
  managerStarted: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  managerInitialized: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  deviceReady: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  devicesReady: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  deviceStopped: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  deviceEnabled: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  deviceDisabled: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
  error: (arg: any, client: ClientApiState<PeerMetadata, TrackMetadata>) => void;
}

export class Client<PeerMetadata, TrackMetadata>
  extends (EventEmitter as {
    new <PeerMetadata, TrackMetadata>(): TypedEmitter<Required<ClientEvents<PeerMetadata, TrackMetadata>>>;
  })<PeerMetadata, TrackMetadata>
  implements ClientApiState<PeerMetadata, TrackMetadata>
{
  private readonly client: JellyfishClient<PeerMetadata, TrackMetadata>;
  private readonly deviceManager: DeviceManager | null = null;
  private state: State<PeerMetadata, TrackMetadata> | null = null;

  constructor(config: UseUserMediaConfig) {
    super();
    this.client = new JellyfishClient<PeerMetadata, TrackMetadata>();
    // todo remove config from constructor
    this.deviceManager = new DeviceManager(config);

    this.client.on("socketOpen", (event) => {
      this.emit("socketOpen", event, this);
    });

    this.client.on("socketError", (event) => {
      this.emit("socketError", event, this);
    });

    this.client.on("socketClose", (event) => {
      this.emit("socketClose", event, this);
    });

    this.client.on("authSuccess", () => {
      this.emit("authSuccess", this);
    });

    this.client.on("authError", () => {
      this.emit("authError", this);
    });

    this.client.on("disconnected", () => {
      this.emit("disconnected", this);
    });

    this.client.on("joined", (peerId: string, peersInRoom: Endpoint<PeerMetadata, TrackMetadata>[]) => {
      this.emit("joined", { peerId, peers: peersInRoom }, this);
    });
    // todo handle state and handle callback
    this.client.on("joinError", (metadata) => {
      this.emit("joinError", metadata, this);
    });
    this.client.on("peerJoined", (peer) => {
      this.emit("peerJoined", peer, this);
    });
    this.client.on("peerUpdated", (peer) => {
      this.emit("peerUpdated", peer, this);
    });
    this.client.on("peerLeft", (peer) => {
      this.emit("peerLeft", peer, this);
    });
    this.client.on("trackReady", (ctx) => {
      this.emit("trackReady", ctx, this);
    });
    this.client.on("trackAdded", (ctx) => {
      this.emit("trackAdded", ctx, this);

      ctx.on("encodingChanged", () => {
        this.emit("encodingChanged", ctx, this);
      });
      ctx.on("voiceActivityChanged", () => {
        this.emit("voiceActivityChanged", ctx, this);
      });
    });
    this.client.on("trackRemoved", (ctx) => {
      this.emit("trackRemoved", ctx, this);
      ctx.removeAllListeners();
    });
    this.client.on("trackUpdated", (ctx) => {
      this.emit("trackUpdated", ctx, this);
    });
    this.client.on("bandwidthEstimationChanged", (estimation) => {
      this.emit("bandwidthEstimationChanged", estimation, this);
    });

    this.deviceManager.on("deviceDisabled", (a) => {
      this.emit("deviceDisabled", a, this);
    });

    this.deviceManager.on("deviceEnabled", (a) => {
      this.emit("deviceEnabled", a, this);
    });

    this.deviceManager.on("managerInitialized", (a) => {
      this.emit("managerInitialized", a, this);
    });

    this.deviceManager.on("managerStarted", (a) => {
      this.emit("managerStarted", a, this);
    });

    this.deviceManager.on("deviceStopped", (a) => {
      this.emit("deviceStopped", a, this);
    });

    this.deviceManager.on("deviceReady", (a) => {
      this.emit("deviceReady", a, this);
    });

    this.deviceManager.on("devicesReady", (a) => {
      this.emit("devicesReady", a, this);
    });

    this.deviceManager.on("error", (a) => {
      this.emit("error", a, this);
    });
  }

  getApi() {
    throw new Error("Method not implemented.");
  }

  public getSnapshot() {
    if (!this.state) throw Error("State not initialized!");
    return this.state;
  }

  private trackContextToTrack(track: TrackContext<PeerMetadata, TrackMetadata>): Track<TrackMetadata> {
    return {
      rawMetadata: track.rawMetadata,
      metadata: track.metadata,
      trackId: track.trackId,
      stream: track.stream,
      simulcastConfig: track.simulcastConfig || null,
      encoding: track.encoding || null,
      vadStatus: track.vadStatus,
      track: track.track,
      metadataParsingError: track.metadataParsingError,
    };
  }

  public addTrack(
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig: SimulcastConfig = { enabled: false, activeEncodings: [], disabledEncodings: [] },
    maxBandwidth: TrackBandwidthLimit = 0, // unlimited bandwidth
  ): Promise<string> {
    if (!this.client) throw Error("Client not initialized");

    return this.client.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
  }

  private stateToSnapshot(): State<PeerMetadata, TrackMetadata> {
    if (!this.deviceManager) Error("Device manager is null");

    const localEndpoint = this.client.getLocalEndpoint();

    const localTracks: Record<TrackId, Track<TrackMetadata>> = {};
    localEndpoint.tracks.forEach((track) => {
      localTracks[track.trackId] = this.trackContextToTrack(track);
    });

    const remote: Record<PeerId, PeerState<PeerMetadata, TrackMetadata>> = {};

    const tracksWithOrigin: Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>> = {};

    Object.values(this.client.getRemoteEndpoints()).forEach((endpoint) => {
      const tracks: Record<TrackId, Track<TrackMetadata>> = {};
      endpoint.tracks.forEach((track) => {
        const mappedTrack = this.trackContextToTrack(track);
        tracks[track.trackId] = mappedTrack;
        tracksWithOrigin[track.trackId] = { ...mappedTrack, origin: endpoint };
      });

      remote[endpoint.id] = {
        rawMetadata: endpoint.rawMetadata,
        metadata: endpoint.metadata,
        metadataParsingError: endpoint.metadataParsingError,
        id: endpoint.id,
        tracks,
      };
    });

    return {
      screenshare: null,
      media: null,
      connectivity: null,
      local: {
        id: localEndpoint.id,
        metadata: localEndpoint.metadata,
        metadataParsingError: localEndpoint.metadataParsingError,
        rawMetadata: localEndpoint.rawMetadata,
        tracks: localTracks, // to record
      },
      status: "connected",
      remote,
      bandwidthEstimation: this.client.getBandwidthEstimation(),
      tracks: tracksWithOrigin,
      devices: {
        init: () => this?.deviceManager?.init(),
        start: (config) => this?.deviceManager?.start(config),
        camera: {
          stop: () => {
            this?.deviceManager?.stop("video");
          },
          setEnable: (value: boolean) => this?.deviceManager?.setEnable("video", value),
          start: (deviceId?: string) => {
            this?.deviceManager?.start({ videoDeviceId: deviceId ?? true });
          },
          addTrack: (
            trackMetadata?: TrackMetadata,
            simulcastConfig?: SimulcastConfig,
            maxBandwidth?: TrackBandwidthLimit,
          ) => {
            const media = this.deviceManager?.video.media;

            if (!media || !media.stream || !media.track) throw Error("Device is unavailable");
            const { stream, track } = media;

            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.video.media?.track?.id,
            );

            if (prevTrack) throw Error("Track already added");

            return this.client.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
          },
          removeTrack: () => {
            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.video.media?.track?.id,
            );

            if (!prevTrack) throw Error("There is no video track");

            return this.client.removeTrack(prevTrack.trackId);
          },
          replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) => {
            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.video.media?.track?.id,
            );

            if (!prevTrack) throw Error("There is no video track");

            return this.client.replaceTrack(prevTrack.trackId, newTrack, newTrackMetadata);
          },
          // broadcast: video,
          status: this?.deviceManager?.getSnapshot()?.video?.status || null,
          stream: this?.deviceManager?.getSnapshot()?.video.media?.stream || null,
          track: this?.deviceManager?.getSnapshot()?.video.media?.track || null,
          enabled: this?.deviceManager?.getSnapshot()?.video.media?.enabled || false,
          deviceInfo: this?.deviceManager?.getSnapshot()?.video.media?.deviceInfo || null,
          error: this?.deviceManager?.getSnapshot()?.video?.error || null,
          devices: this?.deviceManager?.getSnapshot()?.video?.devices || null,
        },
        microphone: {
          stop: () => this?.deviceManager?.stop("audio"),
          setEnable: (value: boolean) => this?.deviceManager?.setEnable("audio", value),
          start: (deviceId?: string) => {
            this?.deviceManager?.start({ audioDeviceId: deviceId ?? true });
          },
          addTrack: (trackMetadata?: TrackMetadata) => {
            const media = this.deviceManager?.audio.media;

            if (!media || !media.stream || !media.track) throw Error("Device is unavailable");
            const { stream, track } = media;

            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.audio.media?.track?.id,
            );

            if (prevTrack) throw Error("Track already added");

            return this.client.addTrack(track, stream, trackMetadata);
          },
          removeTrack: () => {
            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.audio.media?.track?.id,
            );

            if (!prevTrack) throw Error("There is no audio track");

            return this.client.removeTrack(prevTrack.trackId);
          },
          replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) => {
            const prevTrack = Object.values(localTracks).find(
              (track) => track.track?.id === this.deviceManager?.audio.media?.track?.id,
            );

            if (!prevTrack) throw Error("There is no audio track");

            return this.client.replaceTrack(prevTrack.trackId, newTrack, newTrackMetadata);
          },
          // broadcast: audio,
          status: this?.deviceManager?.getSnapshot()?.audio?.status || null,
          stream: this?.deviceManager?.getSnapshot()?.audio.media?.stream || null,
          track: this?.deviceManager?.getSnapshot()?.audio.media?.track || null,
          enabled: this?.deviceManager?.getSnapshot()?.audio.media?.enabled || false,
          deviceInfo: this?.deviceManager?.getSnapshot()?.audio.media?.deviceInfo || null,
          error: this?.deviceManager?.getSnapshot()?.audio?.error || null,
          devices: this?.deviceManager?.getSnapshot()?.audio?.devices || null,
        },
        screenshare: null,
      },
    };
  }
}
