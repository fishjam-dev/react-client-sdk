import type { TrackEncoding, VadStatus, SimulcastConfig } from "@jellyfish-dev/ts-client-sdk";
import { UseUserMediaState } from "./types";
import { UseCameraAndMicrophoneResult } from "./types";
import { Client } from "./Client";
import { DeviceManager } from "./DeviceManager";
import { ScreenShareManager } from "./ScreenShareManager";

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

export type PeerStatus = "connecting" | "connected" | "authenticated" | "joined" | "error" | "closed" | null;

export type State<PeerMetadata, TrackMetadata> = {
  local: PeerState<PeerMetadata, TrackMetadata> | null;
  remote: Record<PeerId, PeerState<PeerMetadata, TrackMetadata>>;
  // only peer tracks
  // todo unlock other component tracks (e.g. file component)
  tracks: Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;
  bandwidthEstimation: bigint;
  status: PeerStatus;
  media: UseUserMediaState | null;
  devices: UseCameraAndMicrophoneResult<TrackMetadata>;
  client: Client<PeerMetadata, TrackMetadata>;
  deviceManager: DeviceManager;
  screenShareManager: ScreenShareManager;
};

export type SetStore<PeerMetadata, TrackMetadata> = (
  setter: (prevState: State<PeerMetadata, TrackMetadata>) => State<PeerMetadata, TrackMetadata>,
) => void;

export type Selector<PeerMetadata, TrackMetadata, Result> = (snapshot: State<PeerMetadata, TrackMetadata>) => Result;
