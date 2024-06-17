import type {
  AuthErrorReason,
  Component,
  CreateConfig,
  MessageEvents,
  Peer,
  TrackContext,
} from "@fishjam-dev/ts-client";
import type { PeerId, PeerState, PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
import type { DeviceManagerEvents } from "./DeviceManager";
import type { DeviceManager } from "./DeviceManager";
import type { MediaDeviceType, ScreenShareManagerConfig } from "./ScreenShareManager";
import type { ScreenShareManager } from "./ScreenShareManager";
import type { DeviceManagerConfig, Devices, DeviceState, MediaState } from "./types";

export type ClientApi<PeerMetadata, TrackMetadata> = {
  local: PeerState<PeerMetadata, TrackMetadata> | null;

  peers: Record<PeerId, PeerState<PeerMetadata, TrackMetadata>>;
  peersTracks: Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;

  components: Record<PeerId, PeerState<PeerMetadata, TrackMetadata>>;
  componentsTracks: Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;

  bandwidthEstimation: bigint;
  status: PeerStatus;
  media: MediaState | null;
  devices: Devices<TrackMetadata>;
  deviceManager: DeviceManager;
  screenShareManager: ScreenShareManager;
};

export interface ClientEvents<PeerMetadata, TrackMetadata> {
  /**
   * Emitted when the websocket connection is closed
   *
   * @param {CloseEvent} event - Close event object from the websocket
   */
  socketClose: (event: CloseEvent, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Emitted when occurs an error in the websocket connection
   *
   * @param {Event} event - Event object from the websocket
   */
  socketError: (event: Event, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Emitted when the websocket connection is opened
   *
   * @param {Event} event - Event object from the websocket
   */
  socketOpen: (event: Event, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when authentication is successful */
  authSuccess: (client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when authentication fails */
  authError: (reason: AuthErrorReason, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /** Emitted when the connection is closed */
  disconnected: (client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called when peer was accepted.
   */
  joined: (
    event: {
      peerId: string;
      peers: Peer<PeerMetadata, TrackMetadata>[];
      components: Component<PeerMetadata, TrackMetadata>[];
    },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called when peer was not accepted
   * @param metadata - Pass through for client application to communicate further actions to frontend
   */
  joinError: (metadata: any, client: ClientApi<PeerMetadata, TrackMetadata>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Called when data in a new track arrives.
   *
   * This callback is always called after {@link MessageEvents.trackAdded}.
   * It informs user that data related to the given track arrives and can be played or displayed.
   */
  trackReady: (ctx: TrackContext<PeerMetadata, TrackMetadata>, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time the peer which was already in the room, adds new track. Fields track and stream will be set to null.
   * These fields will be set to non-null value in {@link MessageEvents.trackReady}
   */
  trackAdded: (ctx: TrackContext<PeerMetadata, TrackMetadata>, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called when some track will no longer be sent.
   *
   * It will also be called before {@link MessageEvents.peerLeft} for each track of this peer.
   */
  trackRemoved: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time peer has its track metadata updated.
   */
  trackUpdated: (
    ctx: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time new peer joins the room.
   */
  peerJoined: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time peer leaves the room.
   */
  peerLeft: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time peer has its metadata updated.
   */
  peerUpdated: (peer: Peer<PeerMetadata, TrackMetadata>, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called each time new Component is added to the room.
   */
  componentAdded: (
    peer: Component<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time Component is removed from the room.
   */
  componentRemoved: (
    peer: Component<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called each time Component has its metadata updated.
   */
  componentUpdated: (
    peer: Component<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Called in case of errors related to multimedia session e.g. ICE connection.
   */
  connectionError: (message: string, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  /**
   * Called every time the server estimates client's bandiwdth.
   *
   * @param {bigint} estimation - client's available incoming bitrate estimated
   * by the server. It's measured in bits per second.
   */
  bandwidthEstimationChanged: (estimation: bigint, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  // track context events
  encodingChanged: (
    context: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  /**
   * Emitted every time an update about voice activity is received from the server.
   */
  voiceActivityChanged: (
    context: TrackContext<PeerMetadata, TrackMetadata>,
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;

  // device manager events
  managerStarted: (
    event: Parameters<DeviceManagerEvents["managerInitialized"]>[0] & {
      mediaDeviceType: MediaDeviceType;
    },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  managerInitialized: (
    event: { audio?: DeviceState; video?: DeviceState; mediaDeviceType: MediaDeviceType },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  deviceReady: (
    event: Parameters<DeviceManagerEvents["deviceReady"]>[0] & { mediaDeviceType: MediaDeviceType },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  devicesStarted: (
    event: Parameters<DeviceManagerEvents["devicesStarted"]>[0] & { mediaDeviceType: MediaDeviceType },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  devicesReady: (
    event: Parameters<DeviceManagerEvents["devicesReady"]>[0] & { mediaDeviceType: MediaDeviceType },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  deviceStopped: (
    event: Parameters<DeviceManagerEvents["deviceStopped"]>[0] & { mediaDeviceType: MediaDeviceType },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  deviceEnabled: (
    event: Parameters<DeviceManagerEvents["deviceEnabled"]>[0] & {
      mediaDeviceType: MediaDeviceType;
    },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  deviceDisabled: (
    event: Parameters<DeviceManagerEvents["deviceDisabled"]>[0] & {
      mediaDeviceType: MediaDeviceType;
    },
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (arg: any, client: ClientApi<PeerMetadata, TrackMetadata>) => void;

  targetTrackEncodingRequested: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["targetTrackEncodingRequested"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackAdded: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackAdded"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackRemoved: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackRemoved"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackReplaced: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackReplaced"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackMuted: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackMuted"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackUnmuted: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackUnmuted"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackBandwidthSet: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackBandwidthSet"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackEncodingBandwidthSet: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackEncodingBandwidthSet"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackEncodingEnabled: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackEncodingEnabled"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackEncodingDisabled: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackEncodingDisabled"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localEndpointMetadataChanged: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localEndpointMetadataChanged"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  localTrackMetadataChanged: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["localTrackMetadataChanged"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
  disconnectRequested: (
    event: Parameters<MessageEvents<PeerMetadata, TrackMetadata>["disconnectRequested"]>[0],
    client: ClientApi<PeerMetadata, TrackMetadata>,
  ) => void;
}

export type ReactClientCreteConfig<PeerMetadata, TrackMetadata> = {
  clientConfig?: CreateConfig<PeerMetadata, TrackMetadata>;
  deviceManagerDefaultConfig?: DeviceManagerConfig;
  screenShareManagerDefaultConfig?: ScreenShareManagerConfig;
};
