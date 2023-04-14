import type { SimulcastConfig, TrackBandwidthLimit, TrackEncoding } from "@jellyfish-dev/membrane-webrtc-js";
import { JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import { addTrack, removeTrack, replaceTrack, updateTrackMetadata } from "./stateMappers";
import { SetStore } from "./state.types";

// todo implement
//  setTrackBandwidth
//  setEncodingBandwidth
//  prioritizeTrack
//  unprioritizeTrack
//  setPreferedVideoSizes
//  updatePeerMetadata
export type Api<TrackMetadata> = {
  /**
   * Adds track that will be sent to the RTC Engine.
   * @param track - Audio or video track e.g. from your microphone or camera.
   * @param stream  - Stream that this track belongs to.
   * @param trackMetadata - Any information about this track that other peers will
   * receive in {@link Callbacks.onPeerJoined}. E.g. this can source of the track - wheather it's
   * screensharing, webcam or some other media device.
   * @param simulcastConfig - Simulcast configuration. By default simulcast is disabled.
   * For more information refer to {@link SimulcastConfig}.
   * @param maxBandwidth - maximal bandwidth this track can use.
   * Defaults to 0 which is unlimited.
   * This option has no effect for simulcast and audio tracks.
   * For simulcast tracks use `{@link MembraneWebRTC.setTrackBandwidth}.
   * @returns {string} Returns id of added track
   * @example
   * ```ts
   * let localStream: MediaStream = new MediaStream();
   * try {
   *   localAudioStream = await navigator.mediaDevices.getUserMedia(
   *     AUDIO_CONSTRAINTS
   *   );
   *   localAudioStream
   *     .getTracks()
   *     .forEach((track) => localStream.addTrack(track));
   * } catch (error) {
   *   console.error("Couldn't get microphone permission:", error);
   * }
   *
   * try {
   *   localVideoStream = await navigator.mediaDevices.getUserMedia(
   *     VIDEO_CONSTRAINTS
   *   );
   *   localVideoStream
   *     .getTracks()
   *     .forEach((track) => localStream.addTrack(track));
   * } catch (error) {
   *  console.error("Couldn't get camera permission:", error);
   * }
   *
   * localStream
   *  .getTracks()
   *  .forEach((track) => webrtc.addTrack(track, localStream));
   * ```
   */
  addTrack: (
    track: MediaStreamTrack,
    stream: MediaStream,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit
  ) => string;

  /**
   * Replaces a track that is being sent to the RTC Engine.
   * @param track - Audio or video track.
   * @param {string} trackId - Id of audio or video track to replace.
   * @param {MediaStreamTrack} newTrack
   * @param {any} [newMetadata] - Optional track metadata to apply to the new track. If no
   *                              track metadata is passed, the old track metadata is retained.
   * @returns {Promise<boolean>} success
   * @example
   * ```ts
   * // setup camera
   * let localStream: MediaStream = new MediaStream();
   * try {
   *   localVideoStream = await navigator.mediaDevices.getUserMedia(
   *     VIDEO_CONSTRAINTS
   *   );
   *   localVideoStream
   *     .getTracks()
   *     .forEach((track) => localStream.addTrack(track));
   * } catch (error) {
   *   console.error("Couldn't get camera permission:", error);
   * }
   * let oldTrackId;
   * localStream
   *  .getTracks()
   *  .forEach((track) => trackId = webrtc.addTrack(track, localStream));
   *
   * // change camera
   * const oldTrack = localStream.getVideoTracks()[0];
   * let videoDeviceId = "abcd-1234";
   * navigator.mediaDevices.getUserMedia({
   *      video: {
   *        ...(VIDEO_CONSTRAINTS as {}),
   *        deviceId: {
   *          exact: videoDeviceId,
   *        },
   *      }
   *   })
   *   .then((stream) => {
   *     let videoTrack = stream.getVideoTracks()[0];
   *     webrtc.replaceTrack(oldTrackId, videoTrack);
   *   })
   *   .catch((error) => {
   *     console.error('Error switching camera', error);
   *   })
   * ```
   */
  replaceTrack: (
    trackId: string,
    newTrack: MediaStreamTrack,
    stream: MediaStream,
    newTrackMetadata?: TrackMetadata
  ) => Promise<boolean>;

  /**
   * Removes a track from connection that was being sent to the RTC Engine.
   * @param {string} trackId - Id of audio or video track to remove.
   * @example
   * ```ts
   * // setup camera
   * let localStream: MediaStream = new MediaStream();
   * try {
   *   localVideoStream = await navigator.mediaDevices.getUserMedia(
   *     VIDEO_CONSTRAINTS
   *   );
   *   localVideoStream
   *     .getTracks()
   *     .forEach((track) => localStream.addTrack(track));
   * } catch (error) {
   *   console.error("Couldn't get camera permission:", error);
   * }
   *
   * let trackId
   * localStream
   *  .getTracks()
   *  .forEach((track) => trackId = webrtc.addTrack(track, localStream));
   *
   * // remove track
   * webrtc.removeTrack(trackId)
   * ```
   */
  removeTrack: (trackId: string) => void;

  /**
   * Updates the metadata for a specific track.
   * @param trackId - trackId (generated in addTrack) of audio or video track.
   * @param trackMetadata - Data about this track that other peers will receive upon joining.
   *
   * If the metadata is different from what is already tracked in the room, the optional
   * callback `onTrackUpdated` will be triggered for other peers in the room.
   */
  updateTrackMetadata: (trackId: string, trackMetadata: TrackMetadata) => void;

  /**
   * Disables track encoding so that it will be no longer sent to the server.
   * @param {string} trackId - id of track
   * @param {rackEncoding} encoding - encoding that will be disabled
   * @example
   * ```ts
   * const trackId = webrtc.addTrack(track, stream, {}, {enabled: true, active_encodings: ["l", "m", "h"]});
   * webrtc.disableTrackEncoding(trackId, "l");
   * ```
   */
  disableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;

  /**
   * Enables track encoding so that it will be sent to the server.
   * @param {string} trackId - id of track
   * @param {TrackEncoding} encoding - encoding that will be enabled
   * @example
   * ```ts
   * const trackId = webrtc.addTrack(track, stream, {}, {enabled: true, active_encodings: ["l", "m", "h"]});
   * webrtc.disableTrackEncoding(trackId, "l");
   * // wait some time
   * webrtc.enableTrackEncoding(trackId, "l");
   * ```
   */
  enableTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;

  /**
   * Disables track encoding so that it will be no longer sent to the server.
   * @param {string} trackId - id of track
   * @param {rackEncoding} encoding - encoding that will be disabled
   * @example
   * ```ts
   * const trackId = webrtc.addTrack(track, stream, {}, {enabled: true, active_encodings: ["l", "m", "h"]});
   * webrtc.disableTrackEncoding(trackId, "l");
   * ```
   */
  setTargetTrackEncoding: (trackId: string, encoding: TrackEncoding) => void;
};

/**
 * Creates a wrapper for the MembraneWebRTC instance to enable updating the store.
 *
 * @param client - MembraneWebRTC instance
 * @param setStore - function that sets the store
 * @returns Wrapper for the MembraneWebRTC instance
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
