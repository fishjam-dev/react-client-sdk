import { Channel, MessageRef, Socket } from "phoenix";
import { MembraneWebRTC, Peer, SerializedMediaEvent, TrackContext } from "@jellyfish-dev/membrane-webrtc-js";
import TypedEmitter from "typed-emitter";
import { EventEmitter } from "events";
import { Callbacks } from "@jellyfish-dev/membrane-webrtc-js/dist/membraneWebRTC";

type MessageEvents = Omit<Callbacks, "onSendMediaEvent"> & {
  onSocketClose: (event: CloseEvent) => void;
  onSocketError: (event: Event) => void;
  onSocketOpen: (event: Event) => void;
};

export type ConnectConfig = {
  websocketUrl?: string;
  disableDeprecated?: boolean;
};

export class JellyfishClient<
  PeerMetadata,
  TrackMetadata
> extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
  // for backward compatibility with videoroom: TODO remove
  socket: Socket | null = null;
  websocket: WebSocket | null = null;
  // for backward compatibility with videoroom: TODO remove
  signaling: Channel | null = null;
  webrtc: MembraneWebRTC | null = null;
  socketOnCloseRef: MessageRef | null = null;
  socketOnErrorRef: MessageRef | null = null;

  constructor() {
    super();
  }

  connect(roomId: string, peerId: string, peerMetadata: PeerMetadata, isSimulcastOn: boolean, config?: ConnectConfig) {
    // const websocketUrl = config?.websocketUrl ?? "/socket";

    this.websocket = new WebSocket(`ws://localhost:4000/socket/websocket?peer_id=${peerId}&room_id=${roomId}`);
    this.websocket.addEventListener("open", (event) => {
      console.log("websocket open", event);
      this.emit("onSocketOpen", event);
    });
    this.websocket.addEventListener("error", (event) => {
      console.log("websocket error", event);
      this.emit("onSocketError", event);
    });
    this.websocket.addEventListener("close", (event) => {
      console.log("websocket close", event);
      this.emit("onSocketClose", event);
    });

    // client
    // this.socket = new Socket(websocketUrl);
    // this.socket.connect();
    // this.socketOnCloseRef = this.socket.onClose(() => this.cleanUp());
    // this.socketOnErrorRef = this.socket.onError(() => this.cleanUp());

    // this.signaling = this.socket.channel(roomId, {
    //   isSimulcastOn: isSimulcastOn,
    // });

    // this.signaling.onError((reason: any) => {
    //   console.error("WebrtcChannel error occurred");
    //   console.error(reason);
    //   // setErrorMessage("WebrtcChannel error occurred");
    // });
    // this.signaling.onClose(() => {
    //   return;
    // });

    const includeOnTrackEncodingChanged = !config?.disableDeprecated;

    const callbacks: Callbacks = {
      onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
        const messageJS = {
          type: "mediaEvent",
          data: mediaEvent,
        };
        const message = JSON.stringify(messageJS);
        // console.log("%cTO_ENGINE", "color: blue");
        // console.log({
        //   mediaEvent: JSON.parse(mediaEvent),
        //   message: messageJS,
        //   toSend: message,
        // });
        this.websocket?.send(message);
        // this.signaling?.push("mediaEvent", { data: mediaEvent });
      },

      onConnectionError: (message) => {
        this.emit("onConnectionError", message);
      },

      // todo [Peer] -> Peer[] ???
      onJoinSuccess: (peerId, peersInRoom: [Peer]) => {
        this.emit("onJoinSuccess", peerId, peersInRoom);
      },

      onRemoved: (reason) => {
        this.emit("onRemoved", reason);
      },

      onPeerJoined: (peer) => {
        this.emit("onPeerJoined", peer);
      },

      onPeerLeft: (peer) => {
        this.emit("onPeerLeft", peer);
      },

      onPeerUpdated: (peer: Peer) => {
        this.emit("onPeerUpdated", peer);
      },

      onTrackReady: (ctx) => {
        this.emit("onTrackReady", ctx);
      },

      onTrackAdded: (ctx) => {
        this.emit("onTrackAdded", ctx);
      },

      onTrackRemoved: (ctx) => {
        this.emit("onTrackRemoved", ctx);
      },

      onTrackUpdated: (ctx: TrackContext) => {
        this.emit("onTrackUpdated", ctx);
      },

      onTracksPriorityChanged: (enabledTracks: TrackContext[], disabledTracks: TrackContext[]) => {
        this.emit("onTracksPriorityChanged", enabledTracks, disabledTracks);
      },

      onJoinError: (metadata) => {
        this.emit("onJoinError", metadata);
      },

      onBandwidthEstimationChanged: (estimation) => {
        this.emit("onBandwidthEstimationChanged", estimation);
      },

      ...(includeOnTrackEncodingChanged && {
        onTrackEncodingChanged: (peerId, trackId, encoding) => {
          this.emit("onTrackEncodingChanged", peerId, trackId, encoding);
        },
      }),
    }

    this.webrtc = new MembraneWebRTC();

    let keyCallback: keyof Callbacks;
    for (keyCallback in callbacks) {
      const callback = callbacks[keyCallback];
      this.webrtc.on(keyCallback, callback);
    }


    // this.signaling.on("mediaEvent", (event) => {
    //   this.webrtc?.receiveMediaEvent(event.data);
    // });

    this.websocket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      // console.log("%cTO_CLIENT", "color: red");
      const toSend = data["data"];
      // console.log({
      //   event: event,
      //   data1: data,
      //   data2: JSON.parse(toSend),
      //   toSend: toSend,
      // });
      this.webrtc?.receiveMediaEvent(toSend);
    });

    // this.signaling.on("simulcastConfig", () => {
    //   return;
    // });

    this.websocket.addEventListener("open", (event) => {
      this.webrtc?.join(peerMetadata);
    });

    // this.signaling
    //   .join()
    //   .receive("ok", () => {
    //     this.webrtc?.join(peerMetadata);
    //   })
    //   .receive("error", (response: any) => {
    //     // setErrorMessage("Connecting error");
    //     console.error("Received error status");
    //     console.error(response);
    //   });
  }

  cleanUp() {
    this.webrtc?.leave();
    this.websocket?.close();
    this.signaling?.leave();
    // if (this.socketOnCloseRef) {
    //   this.socket?.off([this.socketOnCloseRef]);
    // }
    // if (this.socketOnErrorRef) {
    //   this.socket?.off([this.socketOnErrorRef]);
    // }
  }
}
