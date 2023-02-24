import type {
  MembraneWebRTC,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackEncoding
} from "@jellyfish-dev/membrane-webrtc-js";
import { addTrack, removeTrack, replaceTrack, updateTrackMetadata } from "./stateMappers";
import { SetStore } from "./state.types";

export type Api<TrackMetadata> = {
  addTrack: (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit
  ) => string;
  replaceTrack: (
    trackId: string,
    newTrack: MediaStreamTrack,
    stream: MediaStream,
    newTrackMetadata?: TrackMetadata
  ) => Promise<boolean>;
  removeTrack: (trackId: string) => void;
  updateTrackMetadata: (trackId: string, trackMetadata: TrackMetadata) => void;
  disableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
  enableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
  setTargetTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
};

export const createApiWrapper = <PeerMetadata, TrackMetadata>(
  webrtc: MembraneWebRTC,
  setStore: SetStore<PeerMetadata, TrackMetadata>
): Api<TrackMetadata> => ({
  addTrack: (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit
  ) => {
    const remoteTrackId = webrtc.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
    setStore(addTrack(remoteTrackId, track, stream, trackMetadata, simulcastConfig));
    return remoteTrackId;
  },

  replaceTrack: (trackId, newTrack, stream, newTrackMetadata) => {
    const promise = webrtc.replaceTrack(trackId, newTrack, newTrackMetadata);
    setStore(replaceTrack(trackId, newTrack, stream, newTrackMetadata));
    return promise;
  },

  removeTrack: (trackId) => {
    webrtc.removeTrack(trackId);
    setStore(removeTrack(trackId));
  },

  updateTrackMetadata: (trackId, trackMetadata) => {
    webrtc.updateTrackMetadata(trackId, trackMetadata);
    setStore(updateTrackMetadata(trackId, trackMetadata));
  },

  enableTrackEncoding: (trackId, encoding) => {
    webrtc.enableTrackEncoding(trackId, encoding);
  },

  disableTrackEncoding: (trackId: string, encoding: TrackEncoding): void => {
    webrtc.disableTrackEncoding(trackId, encoding);
  },

  setTargetTrackEncoding: (trackId, encoding) => {
    webrtc.setTargetTrackEncoding(trackId, encoding);
  },
});
