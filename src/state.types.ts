import type { TrackEncoding, VadStatus } from "@jellyfish-dev/ts-client-sdk";
import type { Api } from "./api";
import { JellyfishClient, SimulcastConfig } from "@jellyfish-dev/ts-client-sdk";
import { UseUserMediaState } from "./types";
import { UseCameraAndMicrophoneResult } from "./useMedia/types";
import { UseScreenShareState } from "./useMedia/screenshare";
import { Client } from "./Client";

export type TrackId = string;
export type PeerId = string;

export type Track<TrackMetadata> = {
  stream: MediaStream | null;
  encoding: TrackEncoding | null;
  trackId: TrackId;
  metadata?: TrackMetadata;
  rawMetadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  metadataParsingError?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  simulcastConfig: SimulcastConfig | null;
  vadStatus: VadStatus;
  track: MediaStreamTrack | null;
};

export interface Origin<OriginMetadata> {
  id: string;
  type: string;
  metadata?: OriginMetadata;
  rawMetadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  metadataParsingError?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type TrackWithOrigin<PeerMetadata, TrackMetadata> = Track<TrackMetadata> & {
  origin: Origin<PeerMetadata>;
};

export type PeerState<PeerMetadata, TrackMetadata> = {
  id: PeerId;
  metadata?: PeerMetadata;
  rawMetadata: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  metadataParsingError?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  tracks: Record<TrackId, Track<TrackMetadata>>;
};

export type Connectivity<PeerMetadata, TrackMetadata> = {
  api: Api<PeerMetadata, TrackMetadata> | null;
  client: JellyfishClient<PeerMetadata, TrackMetadata> | null;
};

export type PeerStatus = "connecting" | "connected" | "authenticated" | "joined" | "error" | "closed" | null;

export type State<PeerMetadata, TrackMetadata> = {
  local: PeerState<PeerMetadata, TrackMetadata> | null;
  remote: Record<PeerId, PeerState<PeerMetadata, TrackMetadata>>;
  tracks: Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;
  bandwidthEstimation: bigint;
  status: PeerStatus;
  media: UseUserMediaState | null;
  screenShare: UseScreenShareState | null;
  devices: UseCameraAndMicrophoneResult<TrackMetadata>;
  connectivity: Connectivity<PeerMetadata, TrackMetadata> | null;
  client: Client<PeerMetadata, TrackMetadata>;
};

export type SetStore<PeerMetadata, TrackMetadata> = (
  setter: (prevState: State<PeerMetadata, TrackMetadata>) => State<PeerMetadata, TrackMetadata>,
) => void;

export type Selector<PeerMetadata, TrackMetadata, Result> = (snapshot: State<PeerMetadata, TrackMetadata>) => Result;
