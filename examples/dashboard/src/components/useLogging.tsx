import { JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import {
  onBandwidthEstimationChanged,
  onTrackEncodingChanged,
  onTrackReady,
  onTrackRemoved,
  onTrackUpdated,
} from "../../../../src/stateMappers";
import { useEffect } from "react";
import { getBooleanValue } from "../utils/localStorageUtils";

export const useLogging = (client: JellyfishClient<any, any> | null) => {
  useEffect(() => {
    if (!client) return;

    const onJoinSuccess = (peerId: any, peersInRoom: any) => {
      if (getBooleanValue("onJoinSuccess")) {
        console.log({ name: "onJoinSuccess", peerId, peersInRoom });
      }
    };

    const onJoinError = (metadata: any) => {
      if (getBooleanValue("onJoinError")) {
        console.log({ name: "onJoinError", metadata });
      }
    };

    const onJoinRemove = (reason: any) => {
      if (getBooleanValue("onRemoved")) {
        console.log({ name: "onRemoved", reason });
      }
    };

    const onPeerJoined = (peer: any) => {
      if (getBooleanValue("onPeerJoined")) {
        console.log({ name: "onPeerJoined", peer });
      }
    };

    const onPeerUpdated = (peer: any) => {
      if (getBooleanValue("onPeerUpdated")) {
        console.log({ name: "onPeerUpdated", peer });
      }
    };

    const onPeerLeft = (peer: any) => {
      if (getBooleanValue("onPeerLeft")) {
        console.log({ name: "onPeerLeft", peer });
      }
    };

    const onTrackReady = (ctx: any) => {
      if (getBooleanValue("onTrackReady")) {
        console.log({ name: "onTrackReady", ctx });
      }
    };

    const onTrackAdded = (ctx: any) => {
      if (getBooleanValue("onTrackAdded")) {
        console.log({ name: "onTrackAdded", ctx });
      }

      // todo remove this callback in useEffect return
      ctx.on("onEncodingChanged", (context: any) => {
        if (getBooleanValue("onEncodingChanged")) {
          console.log({ name: "onEncodingChanged", context });
        }
      });
      ctx.on("onVoiceActivityChanged", (context: any) => {
        if (getBooleanValue("onVoiceActivityChanged")) {
          console.log({ name: "onVoiceActivityChanged", context });
        }
      });
    };

    const onTrackRemoved = (ctx: any) => {
      if (getBooleanValue("onTrackRemoved")) {
        console.log({ name: "onTrackRemoved", ctx });
      }
    };

    const onTrackUpdated = (ctx: any) => {
      if (getBooleanValue("onTrackUpdated")) {
        console.log({ name: "onTrackUpdated", ctx });
      }
    };

    const onBandwidthEstimationChanged = (estimation: any) => {
      if (getBooleanValue("onBandwidthEstimationChanged")) {
        console.log({ name: "onBandwidthEstimationChanged", estimation });
      }
    };

    const onTrackEncodingChanged = (peerId: any, trackId: any, encoding: any) => {
      if (getBooleanValue("onTrackEncodingChanged")) {
        console.log({
          name: "onTrackEncodingChanged",
          peerId,
          trackId,
          encoding,
        });
      }
    };

    const onTracksPriorityChanged = (enabledTracks: any, disabledTracks: any) => {
      if (getBooleanValue("onTracksPriorityChanged")) {
        console.log({
          name: "onTracksPriorityChanged",
          enabledTracks,
          disabledTracks,
        });
      }
    };

    const onAuthError = () => {
      console.log("onAuthError");
    };

    const onConnectionError = (message: string) => {
      console.log("onConnectionError");
    };

    const onSocketError = () => {
      console.log("onSocketError");
    };

    client.on("onJoinSuccess", onJoinSuccess);
    client.on("onJoinError", onJoinError);
    client.on("onRemoved", onJoinRemove);
    client.on("onPeerJoined", onPeerJoined);
    client.on("onPeerUpdated", onPeerUpdated);
    client.on("onPeerLeft", onPeerLeft);
    client.on("onTrackReady", onTrackReady);
    client.on("onTrackAdded", onTrackAdded);
    client.on("onTrackRemoved", onTrackRemoved);
    client.on("onTrackUpdated", onTrackUpdated);
    client.on("onBandwidthEstimationChanged", onBandwidthEstimationChanged);
    client.on("onTrackEncodingChanged", onTrackEncodingChanged);
    client.on("onTracksPriorityChanged", onTracksPriorityChanged);

    client.on("onAuthError", onAuthError);
    client.on("onConnectionError", onConnectionError);
    client.on("onSocketError", onSocketError);

    return () => {
      client.off("onJoinSuccess", onJoinSuccess);
      client.off("onJoinError", onJoinError);
      client.off("onRemoved", onJoinRemove);
      client.off("onPeerJoined", onPeerJoined);
      client.off("onPeerUpdated", onPeerUpdated);
      client.off("onPeerLeft", onPeerLeft);
      client.off("onTrackReady", onTrackReady);
      client.off("onTrackAdded", onTrackAdded);
      client.off("onTrackRemoved", onTrackRemoved);
      client.off("onTrackUpdated", onTrackUpdated);
      client.off("onBandwidthEstimationChanged", onBandwidthEstimationChanged);
      client.off("onTrackEncodingChanged", onTrackEncodingChanged);
      client.off("onTracksPriorityChanged", onTracksPriorityChanged);

      client.off("onAuthError", onAuthError);
      client.off("onConnectionError", onConnectionError);
      client.off("onSocketError", onSocketError);
    };
  }, [client]);
};
