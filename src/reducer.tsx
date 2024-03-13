import { Dispatch } from "react";
import {
  onAuthError,
  onAuthSuccess,
  onBandwidthEstimationChanged,
  onJoinError,
  onJoinSuccess,
  onPeerJoined,
  onPeerLeft,
  onPeerUpdated,
  onSocketError,
  onSocketOpen,
  onTrackAdded,
  onTrackReady,
  onTrackRemoved,
  onTracksPriorityChanged,
  onTrackUpdated,
} from "./stateMappers";
import { ConnectConfig, Endpoint, SimulcastConfig, TrackContext } from "@jellyfish-dev/ts-client-sdk";
import { UseUserMediaAction } from "./useUserMedia";
import { UseCameraAndMicrophoneResult } from "./useMedia/types";
import { UseScreenshareAction } from "./useMedia/screenshare";

export type ConnectAction<PeerMetadata, TrackMetadata> = {
  type: "connect";
  config: ConnectConfig<PeerMetadata>;
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
};

export type DisconnectAction = {
  type: "disconnect";
};

export type ConnectError = {
  type: "connectError";
};

export type OnJoinErrorAction = {
  type: "onJoinError";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
};

export type OnSocketErrorAction = {
  type: "onSocketError";
};

export type OnSocketCloseAction = {
  type: "onSocketClose";
};

export type OnAuthErrorAction = {
  type: "onAuthError";
};

export type OnJoinSuccessAction<PeerMetadata, TrackMetadata> = {
  type: "onJoinSuccess";
  peerMetadata: PeerMetadata;
  peersInRoom: Endpoint<PeerMetadata, TrackMetadata>[];
  peerId: string;
};

export type OnAuthSuccessAction = {
  type: "onAuthSuccess";
};

export type OnSocketOpenAction = {
  type: "onSocketOpen";
};
export type OnRemovedAction = {
  type: "onRemoved";
  reason: string;
};

export type OnDisconnectedAction = {
  type: "onDisconnected";
};

export type OnTrackAddedAction<PeerMetadata, TrackMetadata> = {
  type: "onTrackAdded";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnTrackReadyAction<PeerMetadata, TrackMetadata> = {
  type: "onTrackReady";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnTrackUpdatedAction<PeerMetadata, TrackMetadata> = {
  type: "onTrackUpdated";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnTrackRemovedAction<PeerMetadata, TrackMetadata> = {
  type: "onTrackRemoved";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnTrackEncodingChange<PeerMetadata, TrackMetadata> = {
  type: "encodingChanged";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnTrackVoiceActivityChanged<PeerMetadata, TrackMetadata> = {
  type: "voiceActivityChanged";
  ctx: TrackContext<PeerMetadata, TrackMetadata>;
};

export type OnBandwidthEstimationChangedAction = {
  type: "onBandwidthEstimationChanged";
  estimation: bigint;
};

export type OnTracksPriorityChangedAction<PeerMetadata, TrackMetadata> = {
  type: "onTracksPriorityChanged";
  enabledTracks: TrackContext<PeerMetadata, TrackMetadata>[];
  disabledTracks: TrackContext<PeerMetadata, TrackMetadata>[];
};

export type OnPeerJoinedAction<PeerMetadata, TrackMetadata> = {
  type: "onPeerJoined";
  peer: Endpoint<PeerMetadata, TrackMetadata>;
};

export type OnPeerLeftAction<PeerMetadata, TrackMetadata> = {
  type: "onPeerLeft";
  peer: Endpoint<PeerMetadata, TrackMetadata>;
};

export type OnPeerUpdatedAction<PeerMetadata, TrackMetadata> = {
  type: "onPeerUpdated";
  peer: Endpoint<PeerMetadata, TrackMetadata>;
};

// Local
export type LocalAddTrackAction<TrackMetadata> = {
  type: "localAddTrack";
  remoteTrackId: string;
  track: MediaStreamTrack;
  stream: MediaStream;
  trackMetadata?: TrackMetadata;
  simulcastConfig?: SimulcastConfig;
};

export type LocalReplaceTrackAction<TrackMetadata> = {
  type: "localReplaceTrack";
  trackId: string;
  newTrack: MediaStreamTrack;
  stream: MediaStream;
  newTrackMetadata?: TrackMetadata;
};

export type LocalRemoveTrackAction = {
  type: "localRemoveTrack";
  trackId: string;
};

export type LocalUpdateTrackMetadataAction<TrackMetadata> = {
  type: "localUpdateTrackMetadata";
  trackId: string;
  trackMetadata: TrackMetadata;
};

export type SetDevices<TrackMetadata> = { type: "setDevices"; data: UseCameraAndMicrophoneResult<TrackMetadata> };

export type Action<PeerMetadata, TrackMetadata> =
  | ConnectAction<PeerMetadata, TrackMetadata>
  | DisconnectAction
  | OnJoinSuccessAction<PeerMetadata, TrackMetadata>
  | OnAuthSuccessAction
  | OnAuthErrorAction
  | OnSocketOpenAction
  | OnSocketErrorAction
  | OnDisconnectedAction
  | OnRemovedAction
  | OnTrackReadyAction<PeerMetadata, TrackMetadata>
  | OnTrackAddedAction<PeerMetadata, TrackMetadata>
  | OnTrackUpdatedAction<PeerMetadata, TrackMetadata>
  | OnTrackRemovedAction<PeerMetadata, TrackMetadata>
  | OnTrackEncodingChange<PeerMetadata, TrackMetadata>
  | OnTrackVoiceActivityChanged<PeerMetadata, TrackMetadata>
  | OnBandwidthEstimationChangedAction
  | OnTracksPriorityChangedAction<PeerMetadata, TrackMetadata>
  | OnPeerJoinedAction<PeerMetadata, TrackMetadata>
  | OnPeerUpdatedAction<PeerMetadata, TrackMetadata>
  | OnPeerLeftAction<PeerMetadata, TrackMetadata>
  | OnJoinErrorAction
  | OnSocketCloseAction
  | LocalReplaceTrackAction<TrackMetadata>
  | LocalRemoveTrackAction
  | LocalUpdateTrackMetadataAction<TrackMetadata>
  | LocalAddTrackAction<TrackMetadata>
  | SetDevices<TrackMetadata>
  | UseUserMediaAction
  | ConnectError
  | UseScreenshareAction;
