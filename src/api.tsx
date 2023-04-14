import type { SimulcastConfig, TrackBandwidthLimit, TrackEncoding } from "@jellyfish-dev/membrane-webrtc-js";
import { addTrack, removeTrack, replaceTrack, updateTrackMetadata } from "./stateMappers";
import { SetStore } from "./state.types";
import { JellyfishClient } from "@jellyfish-dev/ts-client-sdk";

// todo implement
//  setTrackBandwidth
//  setEncodingBandwidth
//  prioritizeTrack
//  unprioritizeTrack
//  setPreferedVideoSizes
//  updatePeerMetadata
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

/**
 * Creates a wrapper for the JellyfishClient instance to enable updating the store.
 *
 * @param client - JellyfishClient client
 * @param setStore - function that sets the store
 * @returns Wrapper for the JellyfishClient instance
 */
export const createApiWrapper = <PeerMetadata, TrackMetadata>(
  client: JellyfishClient<PeerMetadata, TrackMetadata>,
  setStore: SetStore<PeerMetadata, TrackMetadata>
): Api<TrackMetadata> => ({
  addTrack: (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit
  ) => {
    const remoteTrackId = client.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
    setStore(addTrack(remoteTrackId, track, stream, trackMetadata, simulcastConfig));
    return remoteTrackId;
  },

  replaceTrack: (trackId, newTrack, stream, newTrackMetadata) => {
    const promise = client.replaceTrack(trackId, newTrack, newTrackMetadata);
    setStore(replaceTrack(trackId, newTrack, stream, newTrackMetadata));
    return promise;
  },

  removeTrack: (trackId) => {
    client.removeTrack(trackId);
    setStore(removeTrack(trackId));
  },

  updateTrackMetadata: (trackId, trackMetadata) => {
    client.updateTrackMetadata(trackId, trackMetadata);
    setStore(updateTrackMetadata(trackId, trackMetadata));
  },

  enableTrackEncoding: (trackId, encoding) => {
    client.enableTrackEncoding(trackId, encoding);
  },

  disableTrackEncoding: (trackId: string, encoding: TrackEncoding): void => {
    client.disableTrackEncoding(trackId, encoding);
  },

  setTargetTrackEncoding: (trackId, encoding) => {
    client.setTargetTrackEncoding(trackId, encoding);
  },
});
