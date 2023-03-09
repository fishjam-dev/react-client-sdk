import "./style.css";
import { createNoContextMembraneClient } from "../../../src/externalState";
import { JellyfishClient } from "../../../src/jellyfish/JellyfishClient";
import { createStream } from "./createMockStream";

const roomIdInput = document.querySelector<HTMLInputElement>("#room-id-input")!;
const peerIdInput = document.querySelector<HTMLInputElement>("#peer-id-input")!;
const peerNameInput = document.querySelector<HTMLInputElement>("#peer-name-input")!;
const connectButton = document.querySelector<HTMLButtonElement>("#connect-btn")!;
const disconnectButton = document.querySelector<HTMLButtonElement>("#disconnect-btn")!;
const addTrackButton = document.querySelector<HTMLButtonElement>("#add-track-btn")!;
const removeTrackButton = document.querySelector<HTMLButtonElement>("#remove-track-btn")!;
const localVideo = document.querySelector<HTMLVideoElement>("#local-track-video")!;
// const refreshButton = document.querySelector<HTMLVideoElement>("#refresh-code-btn")!;
// const clientStateCode = document.querySelector<HTMLVideoElement>("#client-state-id")!;

const stream = createStream("🧪", "black", 24).stream;
localVideo.srcObject = stream;
let remoteTrakcId: string | null = null;
localVideo.play();

const ROOM_ID_LOCAL_STORAGE_ID = "roomId";
const PEER_ID_LOCAL_STORAGE_ID = "peerId";
const PEER_NAME_LOCAL_STORAGE_ID = "peerName";
roomIdInput.value = localStorage.getItem(ROOM_ID_LOCAL_STORAGE_ID) || "";
peerIdInput.value = localStorage.getItem(PEER_ID_LOCAL_STORAGE_ID) || "";
peerNameInput.value = localStorage.getItem(PEER_NAME_LOCAL_STORAGE_ID) || "";

roomIdInput.addEventListener("input", (event: any) => {
  localStorage.setItem(ROOM_ID_LOCAL_STORAGE_ID, event.target.value);
});
peerIdInput.addEventListener("input", (event: any) => {
  localStorage.setItem(PEER_ID_LOCAL_STORAGE_ID, event.target.value);
});
peerNameInput.addEventListener("input", (event: any) => {
  localStorage.setItem(PEER_NAME_LOCAL_STORAGE_ID, event.target.value);
});

const TrackTypeValues = ["screensharing", "camera", "audio"] as const;
export type TrackType = (typeof TrackTypeValues)[number];

export type PeerMetadata = {
  name: string;
};
export type TrackMetadata = {
  type: TrackType;
  active: boolean;
};

export const { useConnect, useSelector } = createNoContextMembraneClient<PeerMetadata, TrackMetadata>();

const client = new JellyfishClient<PeerMetadata, TrackMetadata>();

client.messageEmitter.on("onJoinSuccess", (_peerId, _peersInRoom) => {
  console.log("Join success!");
  connectButton.classList.add("hidden");
  disconnectButton.classList.remove("hidden");
  addTrackButton.classList.remove("btn-disabled")
});
client.messageEmitter.on("onJoinError", (_metadata) => {});
client.messageEmitter.on("onRemoved", (_reason) => {});
client.messageEmitter.on("onPeerJoined", (_peer) => {});
client.messageEmitter.on("onPeerUpdated", (_peer) => {});
client.messageEmitter.on("onPeerLeft", (_peer) => {});
client.messageEmitter.on("onTrackReady", (_ctx) => {});
client.messageEmitter.on("onTrackAdded", (ctx) => {
  const prevOnEncodingChanged = ctx.onEncodingChanged;
  const prevOnVoiceActivityChanged = ctx.onVoiceActivityChanged;

  ctx.onEncodingChanged = () => {
    prevOnEncodingChanged?.call(ctx);
  };

  ctx.onVoiceActivityChanged = () => {
    prevOnVoiceActivityChanged?.call(ctx);
  };
});
client.messageEmitter.on("onTrackRemoved", (_ctx) => {});
client.messageEmitter.on("onTrackUpdated", (_ctx) => {});
client.messageEmitter.on("onBandwidthEstimationChanged", (_estimation) => {});
client.messageEmitter.on("onTrackEncodingChanged", (_peerId, _trackId, _encoding) => {});
client.messageEmitter.on("onTracksPriorityChanged", (_enabledTracks, _disabledTracks) => {});

connectButton.addEventListener("click", () => {
  console.log("Connect");
  client.connect(roomIdInput.value, peerIdInput.value, { name: peerNameInput.value || "" }, false);
});

disconnectButton.addEventListener("click", () => {
  console.log("Disconnect");
  client.cleanUp();
  connectButton.classList.remove("hidden");
  disconnectButton.classList.add("hidden");
  addTrackButton.classList.add("btn-disabled")
});

addTrackButton.addEventListener("click", () => {
  console.log("Add track");
  const trackMetadata: TrackMetadata = {
    type: "camera",
    active: true,
  };
  const track = stream.getVideoTracks()[0];
  remoteTrakcId = client.webrtc?.addTrack(track, stream, trackMetadata) || null;
  removeTrackButton.classList.remove("hidden");
  addTrackButton.classList.add("hidden");
});

removeTrackButton.addEventListener("click", () => {
  console.log("Remove track");
  remoteTrakcId && client.webrtc?.removeTrack(remoteTrakcId);
  remoteTrakcId = null;
  addTrackButton.classList.remove("hidden");
  removeTrackButton.classList.add("hidden");
});

// refreshButton.addEventListener("click", () => {
//   // clientStateCode.innerHTML = client.webrtc.
// });
//
