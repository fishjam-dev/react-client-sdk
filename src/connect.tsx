import type { SetStore } from "./state.types";
import * as mappers from "./stateMappers";
import { State } from "./state.types";
import { createApiWrapper } from "./api";
import { Config, JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import { DEFAULT_STORE } from "./state";
import { Peer as WebRtcPeer } from "@jellyfish-dev/membrane-webrtc-js/dist/membraneWebRTC";
import { TrackContext, TrackEncoding } from "@jellyfish-dev/membrane-webrtc-js";

/**
 * Connects to the Jellyfish server.
 * Also adds listeners to the JellyfishClient to update the store.
 *
 * @param setStore - function that sets the store
 * @returns function that disconnects from the Jellyfish server
 */
export function connect<PeerMetadata, TrackMetadata>(setStore: SetStore<PeerMetadata, TrackMetadata>) {
  return (config: Config<PeerMetadata>): (() => void) => {
    const { peerMetadata } = config;
    const client = new JellyfishClient<PeerMetadata, TrackMetadata>();
    const trackContextOffFunctions: (() => void)[] = [];

    const onTrackAdded = (ctx: TrackContext) => {
      const onEncodingChange = () => {
        setStore(mappers.onEncodingChanged(ctx));
      };
      const onVoiceActivityChanged = () => {
        setStore(mappers.onVoiceActivityChanged(ctx));
      };

      ctx.on("onEncodingChanged", onEncodingChange);
      ctx.on("onVoiceActivityChanged", onVoiceActivityChanged);

      trackContextOffFunctions.push(() => {
        ctx.off("onEncodingChanged", onEncodingChange);
        ctx.off("onVoiceActivityChanged", onVoiceActivityChanged);
      });

      setStore(mappers.onTrackAdded(ctx));
    };

    const onSocketOpen = () => setStore(mappers.onSocketOpen());
    const onSocketError = () => setStore(mappers.onSocketError());
    const onAuthSuccess = () => setStore(mappers.onAuthSuccess());
    const onAuthError = () => setStore(mappers.onAuthError());
    const onDisconnected = () => setStore(mappers.onDisconnected());
    const onJoinSuccess = (peerId: string, peersInRoom: [WebRtcPeer]) =>
      setStore(mappers.onJoinSuccess(peersInRoom, peerId, peerMetadata));
    // todo handle state
    const onJoinError = (metadata: unknown) => setStore(mappers.onJoinError(metadata));
    const onRemoved = (reason: string) => setStore(mappers.onPeerRemoved(reason));
    const onPeerJoined = (peer: WebRtcPeer) => setStore(mappers.onPeerJoined(peer));
    const onPeerUpdated = (peer: WebRtcPeer) => setStore(mappers.onPeerUpdated(peer));
    const onPeerLeft = (peer: WebRtcPeer) => setStore(mappers.onPeerLeft(peer));
    const onTrackReady = (ctx: TrackContext) => setStore(mappers.onTrackReady(ctx));
    const onTrackRemoved = (ctx: TrackContext) => {
      setStore(mappers.onTrackRemoved(ctx));
      // todo remove listeners from TrackContext
    };
    const onTrackUpdated = (ctx: TrackContext) => setStore(mappers.onTrackUpdated(ctx));
    const onBandwidthEstimationChanged = (estimation: bigint) =>
      setStore(mappers.onBandwidthEstimationChanged(estimation));
    const onTrackEncodingChanged = (peerId: string, trackId: string, encoding: TrackEncoding) =>
      setStore(mappers.onTrackEncodingChanged(peerId, trackId, encoding));
    const onTracksPriorityChanged = (enabledTracks: TrackContext[], disabledTracks: TrackContext[]) =>
      setStore(mappers.onTracksPriorityChanged(enabledTracks, disabledTracks));

    client.on("onTrackAdded", onTrackAdded);
    client.on("onSocketOpen", onSocketOpen);
    client.on("onSocketError", onSocketError);
    client.on("onAuthSuccess", onAuthSuccess);
    client.on("onAuthError", onAuthError);
    client.on("onDisconnected", onDisconnected);
    client.on("onJoinSuccess", onJoinSuccess);
    client.on("onJoinError", onJoinError);
    client.on("onRemoved", onRemoved);
    client.on("onPeerJoined", onPeerJoined);
    client.on("onPeerUpdated", onPeerUpdated);
    client.on("onPeerLeft", onPeerLeft);
    client.on("onTrackReady", onTrackReady);
    client.on("onTrackRemoved", onTrackRemoved);
    client.on("onTrackUpdated", onTrackUpdated);
    client.on("onBandwidthEstimationChanged", onBandwidthEstimationChanged);
    client.on("onTrackEncodingChanged", onTrackEncodingChanged);
    client.on("onTracksPriorityChanged", onTracksPriorityChanged);

    client.connect(config);

    setStore((prevState: State<PeerMetadata, TrackMetadata>): State<PeerMetadata, TrackMetadata> => {
      return {
        ...prevState,
        status: "connecting",
        connectivity: {
          ...prevState.connectivity,
          api: client ? createApiWrapper(client, setStore) : null,
          client: client,
        },
      };
    });

    return () => {
      trackContextOffFunctions.forEach((off) => off());
      client.off("onTrackAdded", onTrackAdded);
      client.off("onSocketOpen", onSocketOpen);
      client.off("onSocketError", onSocketError);
      client.off("onAuthSuccess", onAuthSuccess);
      client.off("onAuthError", onAuthError);
      client.off("onDisconnected", onDisconnected);
      client.off("onJoinSuccess", onJoinSuccess);
      client.off("onJoinError", onJoinError);
      client.off("onRemoved", onRemoved);
      client.off("onPeerJoined", onPeerJoined);
      client.off("onPeerUpdated", onPeerUpdated);
      client.off("onPeerLeft", onPeerLeft);
      client.off("onTrackReady", onTrackReady);
      client.off("onTrackRemoved", onTrackRemoved);
      client.off("onTrackUpdated", onTrackUpdated);
      client.off("onBandwidthEstimationChanged", onBandwidthEstimationChanged);
      client.off("onTrackEncodingChanged", onTrackEncodingChanged);
      client.off("onTracksPriorityChanged", onTracksPriorityChanged);
      setStore(() => DEFAULT_STORE);
      client.cleanUp();
    };
  };
}
