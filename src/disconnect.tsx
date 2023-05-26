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

export function disconnect<PeerMetadata, TrackMetadata>(setStore: SetStore<PeerMetadata, TrackMetadata>) {
  setStore((prevState) => {
    const client = prevState.connectivity.client;

    client?.removeAllListeners("onSocketOpen");
    client?.removeAllListeners("onSocketError");
    client?.removeAllListeners("onAuthSuccess");
    client?.removeAllListeners("onAuthError");
    client?.removeAllListeners("onDisconnected");
    client?.removeAllListeners("onJoinSuccess");
    client?.removeAllListeners("onJoinError");
    client?.removeAllListeners("onRemoved");
    client?.removeAllListeners("onPeerJoined");
    client?.removeAllListeners("onPeerUpdated");
    client?.removeAllListeners("onPeerLeft");
    client?.removeAllListeners("onTrackReady");
    // todo remove inner listeners
    client?.removeAllListeners("onTrackAdded");
    client?.removeAllListeners("onTrackRemoved");
    client?.removeAllListeners("onTrackUpdated");
    client?.removeAllListeners("onBandwidthEstimationChanged");
    client?.removeAllListeners("onTrackEncodingChanged");
    client?.removeAllListeners("onTracksPriorityChanged");
    client?.cleanUp();

    return DEFAULT_STORE;
  });
}
