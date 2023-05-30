import type { SetStore } from "./state.types";

import {
  onAuthError,
  onAuthSuccess,
  onBandwidthEstimationChanged,
  onDisconnected,
  onEncodingChanged,
  onJoinError,
  onJoinSuccess,
  onPeerJoined,
  onPeerLeft,
  onPeerRemoved,
  onPeerUpdated,
  onSocketError,
  onSocketOpen,
  onTrackAdded,
  onTrackEncodingChanged,
  onTrackReady,
  onTrackRemoved,
  onTracksPriorityChanged,
  onTrackUpdated,
  onVoiceActivityChanged,
} from "./stateMappers";
import { State } from "./state.types";
import { createApiWrapper } from "./api";
import { Config, JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import { DEFAULT_STORE } from "./state";
import { MutableRefObject } from "react";
import { creteDefaultStore } from "./create";

/**
 * Connects to the Jellyfish server.
 * Also adds listeners to the JellyfishClient to update the store.
 *
 * @param setStore - function that sets the store
 * @param clientRef - stores current Jellyfish client
 * @returns function that disconnects from the Jellyfish server
 */
export function connect<PeerMetadata, TrackMetadata>(
  setStore: SetStore<PeerMetadata, TrackMetadata>,
  clientRef?: MutableRefObject<JellyfishClient<PeerMetadata, TrackMetadata>>
) {
  return (config: Config<PeerMetadata>): (() => void) => {
    const { peerMetadata } = config;
    console.log("Connect function invoked")

    // const client = new JellyfishClient<PeerMetadata, TrackMetadata>();

    clientRef?.current.on("onSocketOpen", () => {
      setStore(onSocketOpen());
    });

    clientRef?.current.on("onSocketError", () => {
      setStore(onSocketError());
    });

    clientRef?.current.on("onAuthSuccess", () => {
      setStore(onAuthSuccess());
    });

    clientRef?.current.on("onAuthError", () => {
      setStore(onAuthError());
    });

    clientRef?.current.on("onDisconnected", () => {
      setStore(onDisconnected());
    });

    clientRef?.current.on("onJoinSuccess", (peerId, peersInRoom) => {
      setStore(onJoinSuccess(peersInRoom, peerId, peerMetadata));
    });
    // todo handle state and handle callback
    clientRef?.current.on("onJoinError", (metadata) => {
      setStore(onJoinError(metadata));
    });
    clientRef?.current.on("onRemoved", (reason) => {
      setStore(onPeerRemoved(reason));
    });
    clientRef?.current.on("onPeerJoined", (peer) => setStore(onPeerJoined(peer)));
    clientRef?.current.on("onPeerUpdated", (peer) => {
      setStore(onPeerUpdated(peer));
    });
    clientRef?.current.on("onPeerLeft", (peer) => {
      setStore(onPeerLeft(peer));
    });
    clientRef?.current.on("onTrackReady", (ctx) => {
      setStore(onTrackReady(ctx));
    });
    clientRef?.current.on("onTrackAdded", (ctx) => {
      setStore(onTrackAdded(ctx));

      // todo remove listeners
      ctx.on("onEncodingChanged", () => {
        setStore(onEncodingChanged(ctx));
      });
      ctx.on("onVoiceActivityChanged", () => {
        setStore(onVoiceActivityChanged(ctx));
      });
    });
    clientRef?.current.on("onTrackRemoved", (ctx) => {
      setStore(onTrackRemoved(ctx));
    });
    clientRef?.current.on("onTrackUpdated", (ctx) => {
      setStore(onTrackUpdated(ctx));
    });
    clientRef?.current.on("onBandwidthEstimationChanged", (estimation) => {
      setStore(onBandwidthEstimationChanged(estimation));
    });
    clientRef?.current.on("onTrackEncodingChanged", (peerId, trackId, encoding) => {
      setStore(onTrackEncodingChanged(peerId, trackId, encoding));
    });
    // todo handle state
    clientRef?.current.on("onTracksPriorityChanged", (enabledTracks, disabledTracks) => {
      setStore(onTracksPriorityChanged(enabledTracks, disabledTracks));
    });

    clientRef?.current.connect(config);

    setStore((prevState: State<PeerMetadata, TrackMetadata>): State<PeerMetadata, TrackMetadata> => {
      return {
        ...prevState,
        status: "connecting",
        connectivity: {
          ...prevState.connectivity,
          api: clientRef?.current ? createApiWrapper(clientRef?.current, setStore) : null,
          client: clientRef?.current || null,
        },
      };
    });

    return () => {
      console.log("Invoked cleanup function");

      if (clientRef) {
        console.log("Creating new jellyfish client");

        clientRef.current = new JellyfishClient<PeerMetadata, TrackMetadata>();
      }
      setStore(() => creteDefaultStore<PeerMetadata, TrackMetadata>());
      // todo remove all callbacks
      clientRef?.current.cleanUp();
    };
  };
}
