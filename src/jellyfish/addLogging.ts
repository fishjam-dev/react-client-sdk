import { JellyfishClient } from "./JellyfishClient";

export const addLogging = (client: JellyfishClient) => {
  client.messageEmitter.on("onJoinSuccess", (peerId, peersInRoom) => {
    console.log({ name: "onJoinSuccess", peerId, peersInRoom });
  });
  client.messageEmitter.on("onJoinError", (metadata) => {
    console.log({ name: "onJoinError", metadata });
  });
  client.messageEmitter.on("onRemoved", (reason) => {
    console.log({ name: "onRemoved", reason });
  });
  client.messageEmitter.on("onPeerJoined", (peer) => {
    console.log({ name: "onPeerJoined", peer });
  });
  client.messageEmitter.on("onPeerUpdated", (peer) => {
    console.log({ name: "onPeerUpdated", peer });
  });
  client.messageEmitter.on("onPeerLeft", (peer) => {
    console.log({ name: "onPeerLeft", peer });
  });
  client.messageEmitter.on("onTrackReady", (ctx) => {
    console.log({ name: "onTrackReady", ctx });
  });
  client.messageEmitter.on("onTrackAdded", (ctx) => {
    console.log({ name: "onTrackAdded", ctx });
    ctx.onEncodingChanged = () => {
      console.log({ name: "onEncodingChanged", ctx });
    };
    ctx.onVoiceActivityChanged = () => {
      console.log({ name: "onVoiceActivityChanged", ctx });
    };
  });
  client.messageEmitter.on("onTrackRemoved", (ctx) => {
    console.log({ name: "onTrackRemoved", ctx });
  });
  client.messageEmitter.on("onTrackUpdated", (ctx) => {
    console.log({ name: "onTrackUpdated", ctx });
  });
  client.messageEmitter.on("onBandwidthEstimationChanged", (estimation) => {
    console.log({ name: "onBandwidthEstimationChanged", estimation });
  });
  client.messageEmitter.on(
    "onTrackEncodingChanged",
    (peerId, trackId, encoding) => {
      console.log({
        name: "onTrackEncodingChanged",
        peerId,
        trackId,
        encoding,
      });
    }
  );
  client.messageEmitter.on(
    "onTracksPriorityChanged",
    (enabledTracks, disabledTracks) => {
      console.log({
        name: "onTracksPriorityChanged",
        enabledTracks,
        disabledTracks,
      });
    }
  );
};
