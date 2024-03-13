import { SimulcastConfig, TrackBandwidthLimit, TrackEncoding } from "@jellyfish-dev/ts-client-sdk";

// todo implement
//  setTrackBandwidth
//  setEncodingBandwidth
//  updatePeerMetadata
export type Api<PeerMetadata, TrackMetadata> = {
  addTrack: (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit,
  ) => Promise<string>;
  replaceTrack: (
    trackId: string,
    newTrack: MediaStreamTrack,
    stream: MediaStream,
    newTrackMetadata?: TrackMetadata,
  ) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  updateTrackMetadata: (trackId: string, trackMetadata: TrackMetadata) => void;
  disableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
  enableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
  setTargetTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
  updatePeerMetadata: (peerMetadata: PeerMetadata) => void;
};
