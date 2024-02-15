import { JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import { SimulcastConfig, TrackBandwidthLimit, TrackEncoding } from "@jellyfish-dev/ts-client-sdk";
import { Dispatch } from "react";
import { Action } from "./reducer";

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

/**
 * Creates a wrapper for the MembraneWebRTC instance to enable updating the store.
 *
 * @param webrtc - MembraneWebRTC instance
 * @param dispatch - function that sets the store
 * @returns Wrapper for the MembraneWebRTC instance
 */
export const createApiWrapper = <PeerMetadata, TrackMetadata>(
  webrtc: JellyfishClient<PeerMetadata, TrackMetadata>,
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>,
): Api<PeerMetadata, TrackMetadata> => ({
  addTrack: async (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit,
  ): Promise<string> => {
    // todo could reject() so this line could throw an exception
    const remoteTrackId = await webrtc.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
    dispatch({ type: "localAddTrack", remoteTrackId, track, stream, trackMetadata, simulcastConfig });
    return remoteTrackId;
  },

  replaceTrack: async (trackId, newTrack, stream, newTrackMetadata) => {
    await webrtc.replaceTrack(trackId, newTrack, newTrackMetadata);
    dispatch({ type: "localReplaceTrack", trackId, newTrack, stream, newTrackMetadata });
  },

  removeTrack: async (trackId) => {
    await webrtc.removeTrack(trackId);
    dispatch({ type: "localRemoveTrack", trackId });
  },

  updateTrackMetadata: (trackId, trackMetadata) => {
    webrtc.updateTrackMetadata(trackId, trackMetadata);
    dispatch({ type: "localUpdateTrackMetadata", trackId, trackMetadata });
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

  updatePeerMetadata: (peerMetadata: PeerMetadata) => {
    webrtc.updatePeerMetadata(peerMetadata);
  },
});
