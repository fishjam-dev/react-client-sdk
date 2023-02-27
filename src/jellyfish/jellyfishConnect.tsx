import type { SetStore } from "../state.types";

import { JellyfishClient } from "./JellyfishClient";
import {
  onBandwidthEstimationChanged,
  onEncodingChanged,
  onJoinError,
  onJoinSuccess,
  onPeerJoined,
  onPeerLeft,
  onPeerRemoved,
  onPeerUpdated,
  onTrackAdded,
  onTrackEncodingChanged,
  onTrackReady,
  onTrackRemoved,
  onTracksPriorityChanged,
  onTrackUpdated,
  onVoiceActivityChanged,
} from "../stateMappers";
import { addLogging } from "./addLogging";

export type ConnectConfig = {
  websocketUrl?: string;
  disableDeprecated?: boolean;
};

export function connect<PeerMetadata, TrackMetadata>(
  setStore: SetStore<PeerMetadata, TrackMetadata>
) {
  return (
    roomId: string,
    peerMetadata: PeerMetadata,
    isSimulcastOn: boolean,
    config?: ConnectConfig
  ): (() => void) => {
    const client = new JellyfishClient();

    addLogging(client);

    client.messageEmitter.on("onJoinSuccess", (peerId, peersInRoom) => {
      setStore(onJoinSuccess(peersInRoom, peerId, peerMetadata));
    });
    // todo handle state and handle callback
    client.messageEmitter.on("onJoinError", (metadata) => {
      setStore(onJoinError(metadata));
    });
    client.messageEmitter.on("onRemoved", (reason) => {
      setStore(onPeerRemoved(reason));
    });
    client.messageEmitter.on("onPeerJoined", (peer) =>
      setStore(onPeerJoined(peer))
    );
    client.messageEmitter.on("onPeerUpdated", (peer) => {
      setStore(onPeerUpdated(peer));
    });
    client.messageEmitter.on("onPeerLeft", (peer) => {
      setStore(onPeerLeft(peer));
    });
    client.messageEmitter.on("onTrackReady", (ctx) => {
      setStore(onTrackReady(ctx));
    });
    client.messageEmitter.on("onTrackAdded", (ctx) => {
      setStore(onTrackAdded(ctx));

      const prevOnEncodingChanged = ctx.onEncodingChanged;
      const prevOnVoiceActivityChanged = ctx.onVoiceActivityChanged;

      ctx.onEncodingChanged = () => {
        prevOnEncodingChanged?.call(ctx);

        setStore(onEncodingChanged(ctx));
      };

      ctx.onVoiceActivityChanged = () => {
        prevOnVoiceActivityChanged?.call(ctx);

        setStore(onVoiceActivityChanged(ctx));
      };
    });
    client.messageEmitter.on("onTrackRemoved", (ctx) => {
      setStore(onTrackRemoved(ctx));
    });
    client.messageEmitter.on("onTrackUpdated", (ctx) => {
      setStore(onTrackUpdated(ctx));
    });
    client.messageEmitter.on("onBandwidthEstimationChanged", (estimation) => {
      setStore(onBandwidthEstimationChanged(estimation));
    });
    client.messageEmitter.on(
      "onTrackEncodingChanged",
      (peerId, trackId, encoding) => {
        setStore(onTrackEncodingChanged(peerId, trackId, encoding));
      }
    );
    // todo handle state
    client.messageEmitter.on(
      "onTracksPriorityChanged",
      (enabledTracks, disabledTracks) => {
        setStore(onTracksPriorityChanged(enabledTracks, disabledTracks));
      }
    );

    const cleanUp = client.connect<PeerMetadata, TrackMetadata>(setStore)(
      roomId,
      peerMetadata,
      isSimulcastOn,
      config
    );
    return () => {
      cleanUp();
    };
  };
}
