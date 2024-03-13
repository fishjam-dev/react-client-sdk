import { SimulcastConfig, TrackBandwidthLimit, TrackEncoding } from "@jellyfish-dev/ts-client-sdk";
import { Api } from "./api";

export const createEmptyApi = <PeerMetadata, TrackMetadata>(): Api<PeerMetadata, TrackMetadata> => ({
  addTrack: async (
    _track: MediaStreamTrack,
    _stream: MediaStream,
    _trackMetadata?: TrackMetadata,
    _simulcastConfig?: SimulcastConfig,
    _maxBandwidth?: TrackBandwidthLimit,
  ) => {
    throw Error("Jellyfish client is not connected");
  },
  replaceTrack: async (
    _trackId: string,
    _newTrack: MediaStreamTrack,
    _stream: MediaStream,
    _newTrackMetadata?: TrackMetadata,
  ) => {
    throw Error("Jellyfish client is not connected");
  },
  removeTrack: async (_trackId: string) => Promise.reject("Jellyfish client is not connected"),
  updateTrackMetadata: (_trackId: string, _trackMetadata: TrackMetadata) => {
    throw Error("Jellyfish client is not connected");
  },
  disableTrackEncoding: (_trackId: string, _encoding: TrackEncoding) => {
    throw Error("Jellyfish client is not connected");
  },
  enableTrackEncoding: (_trackId: string, _encoding: TrackEncoding) => {
    throw Error("Jellyfish client is not connected");
  },
  setTargetTrackEncoding: (_trackId: string, _encoding: TrackEncoding) => {
    throw Error("Jellyfish client is not connected");
  },
  updatePeerMetadata: (_peerMetadata: PeerMetadata) => {
    throw Error("Jellyfish client is not connected");
  },
});
