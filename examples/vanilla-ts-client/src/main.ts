import "./style.css";
import { JellyfishClient } from "../../../src/jellyfish/JellyfishClient";
import { createStream } from "./createMockStream";
import { enumerateDevices } from "../../../src/navigator";
import { getUserMedia } from "../../../src/navigator";
import { Peer } from "@jellyfish-dev/membrane-webrtc-js";

const roomIdInput = document.querySelector<HTMLInputElement>("#room-id-input")!;
const peerIdInput = document.querySelector<HTMLInputElement>("#peer-id-input")!;
const peerTokenInput = document.querySelector<HTMLInputElement>("#peer-token-input")!;
const peerNameInput = document.querySelector<HTMLInputElement>("#peer-name-input")!;
const connectButton = document.querySelector<HTMLButtonElement>("#connect-btn")!;
const disconnectButton = document.querySelector<HTMLButtonElement>("#disconnect-btn")!;
const addTrackButton = document.querySelector<HTMLButtonElement>("#add-track-btn")!;
const removeTrackButton = document.querySelector<HTMLButtonElement>("#remove-track-btn")!;
const localVideo = document.querySelector<HTMLVideoElement>("#local-track-video")!;
const enumerateDevicesButton = document.querySelector<HTMLVideoElement>("#enumerate-devices-btn")!;

const stream = createStream("🧪", "black", 24).stream;
localVideo.srcObject = stream;
let remoteTrakcId: string | null = null;
localVideo.play();

const LOCAL_STORAGE_KEY = {
  ROOM_ID: "roomId",
  PEER_ID: "peerId",
  PEER_TOKEN: "peerToken",
  PEER_NAME: "peerName",
} as const;

const keyInputMap = {
  [LOCAL_STORAGE_KEY.ROOM_ID]: roomIdInput,
  [LOCAL_STORAGE_KEY.PEER_ID]: peerIdInput,
  [LOCAL_STORAGE_KEY.PEER_TOKEN]: peerTokenInput,
  [LOCAL_STORAGE_KEY.PEER_NAME]: peerNameInput,
} as const;

(function bindLocalStorageToInputs() {
  for (const property in LOCAL_STORAGE_KEY) {
    const key = property as keyof typeof LOCAL_STORAGE_KEY;
    const input = keyInputMap[LOCAL_STORAGE_KEY[key]];
    input.value = localStorage.getItem(LOCAL_STORAGE_KEY[key]) || "";
    input.addEventListener("input", (event: any) => {
      localStorage.setItem(LOCAL_STORAGE_KEY[key], event.target.value);
    });
  }
})();


const TrackTypeValues = ["screensharing", "camera", "audio"] as const;
export type TrackType = (typeof TrackTypeValues)[number];

export type PeerMetadata = {
  name: string;
};
export type TrackMetadata = {
  type: TrackType;
  active: boolean;
};

const client = new JellyfishClient<PeerMetadata, TrackMetadata>();

client.on("onJoinSuccess", (_peerId, peersInRoom) => {
  console.log("Join success!");
  const template = document.querySelector("#remote-peer-template-card")!;
  const remotePeers = document.querySelector("#remote-peers")!;

  (peersInRoom || []).forEach((peer: Peer) => {
    // @ts-ignore
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    card.dataset.peerId = peer.id;

    const peerId = clone.querySelector(".remote-peer-template-id");
    peerId.innerHTML = peer.id;

    remotePeers.appendChild(clone);
  });
});
client.on("onJoinError", (_metadata) => { });
client.on("onRemoved", (_reason) => { });
client.on("onPeerJoined", (peer) => {
  console.log("Join success!");
  const template = document.querySelector("#remote-peer-template-card")!;
  const remotePeers = document.querySelector("#remote-peers")!;

  // @ts-ignore
  const clone = template.content.cloneNode(true);
  const card = clone.querySelector(".card");
  card.dataset.peerId = peer.id;

  const peerId = clone.querySelector(".remote-peer-template-id");
  peerId.innerHTML = peer.id;

  remotePeers.appendChild(clone);
});
client.on("onPeerUpdated", (_peer) => { });
client.on("onPeerLeft", (_peer) => { });
client.on("onTrackReady", (ctx) => {
  console.log("On track ready");
  const peerId = ctx.peer.id;
  const peerComponent = document.querySelector(`div[data-peer-id="${peerId}"`)!;
  const videoPlayer: HTMLVideoElement = peerComponent.querySelector(".remote-peer-template-video")!;

  videoPlayer.srcObject = ctx.stream;
  videoPlayer.play();
  console.log(peerComponent);
});

client.on("onTrackAdded", (ctx) => {
  ctx.on("onEncodingChanged", () => { });
  ctx.on("onVoiceActivityChanged", () => { });
});

client.on("onTrackRemoved", (_ctx) => { });
client.on("onTrackUpdated", (_ctx) => { });
client.on("onBandwidthEstimationChanged", (_estimation) => { });
client.on("onTrackEncodingChanged", (_peerId, _trackId, _encoding) => { });
client.on("onTracksPriorityChanged", (_enabledTracks, _disabledTracks) => { });

connectButton.addEventListener("click", () => {
  console.log("Connect");
  client.connect({ roomId: roomIdInput.value, peerId: peerIdInput.value, peerMetadata: { name: peerNameInput.value || "" }, isSimulcastOn: false, useAuth: peerTokenInput.value !== "", token: peerTokenInput.value })
});

disconnectButton.addEventListener("click", () => {
  console.log("Disconnect");
  client.cleanUp();
});

const addTrack = (stream: MediaStream) => {
  console.log("Add track");
  const trackMetadata: TrackMetadata = {
    type: "camera",
    active: true,
  };
  const track = stream.getVideoTracks()[0];
  remoteTrakcId = client.webrtc?.addTrack(track, stream, trackMetadata) || null;
};

const removeTrack = () => {
  console.log("Remove track");
  remoteTrakcId && client.webrtc?.removeTrack(remoteTrakcId);
  remoteTrakcId = null;
};

addTrackButton.addEventListener("click", () => {
  addTrack(stream);
});

removeTrackButton.addEventListener("click", () => {
  removeTrack();
});

enumerateDevicesButton.addEventListener("click", () => {
  enumerateDevices(true, false).then((result) => {
    console.log(result);
    if (result.video.type !== "OK") return;
    const template = document.querySelector("#video-player-template")!;
    const videoPlayers = document.querySelector("#video-players")!;
    videoPlayers.innerHTML = "";
    result.video.devices.forEach((device) => {
      // @ts-ignore
      const clone = template.content.cloneNode(true);
      const videoPlayer = clone.querySelector(".video-player");

      clone.querySelector(".device-label").innerHTML = device.label;
      clone.querySelector(".device-id").innerHTML = device.deviceId;

      clone.querySelector(".start-template-btn").addEventListener("click", () => {
        console.log("Start");
        getUserMedia(device.deviceId, "video").then((stream) => {
          console.log("Connecting stream");
          videoPlayer.srcObject = stream;
          videoPlayer.play();
        });
      });
      clone.querySelector(".stop-template-btn").addEventListener("click", () => {
        console.log("Stop");
        const stream = videoPlayer.srcObject;
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
        });
        videoPlayer.srcObject = null;
      });

      clone.querySelector(".add-track-template-btn").addEventListener("click", () => {
        if (!videoPlayer.srcObject) return;

        addTrack(videoPlayer.srcObject);
      });

      clone.querySelector(".remove-track-template-btn").addEventListener("click", () => {
        removeTrack();
      });

      videoPlayers.appendChild(clone);
    });
  });
});
