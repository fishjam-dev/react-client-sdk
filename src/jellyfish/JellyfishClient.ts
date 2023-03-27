import { Channel, MessageRef, Socket } from "phoenix";
import {
  Callbacks,
  MembraneWebRTC,
  Peer,
  SerializedMediaEvent,
  TrackContext,
} from "@jellyfish-dev/membrane-webrtc-js";

import TypedEmitter from "typed-emitter";
import { EventEmitter } from "events";

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

    this.webrtc = new MembraneWebRTC();

    this.setupCallbacks();
    // this.setupCallbacks2();

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

  private setupCallbacks() {
    this.webrtc?.on("onSendMediaEvent", (mediaEvent: SerializedMediaEvent) => {
      const messageJS = {
        type: "mediaEvent",
        data: mediaEvent,
      };

      const message = JSON.stringify(messageJS);
      this.websocket?.send(message);
    });

    this.webrtc?.on("onConnectionError", (message) => this.emit("onConnectionError", message));
    this.webrtc?.on("onJoinSuccess", (peerId, peersInRoom: [Peer]) => {
      this.emit("onJoinSuccess", peerId, peersInRoom);
    });
    this.webrtc?.on("onRemoved", (reason) => {
      this.emit("onRemoved", reason);
    });
    this.webrtc?.on("onPeerJoined", (peer) => {
      this.emit("onPeerJoined", peer);
    });
    this.webrtc?.on("onPeerLeft", (peer) => {
      this.emit("onPeerLeft", peer);
    });
    this.webrtc?.on("onPeerUpdated", (peer: Peer) => {
      this.emit("onPeerUpdated", peer);
    });
    this.webrtc?.on("onTrackReady", (ctx: TrackContext) => {
      this.emit("onTrackReady", ctx);
    });
    this.webrtc?.on("onTrackAdded", (ctx) => {
      this.emit("onTrackAdded", ctx);
    });
    this.webrtc?.on("onTrackRemoved", (ctx) => {
      this.emit("onTrackRemoved", ctx);
    });
    this.webrtc?.on("onTrackUpdated", (ctx: TrackContext) => {
      this.emit("onTrackUpdated", ctx);
    });
    this.webrtc?.on("onTracksPriorityChanged", (enabledTracks: TrackContext[], disabledTracks: TrackContext[]) => {
      this.emit("onTracksPriorityChanged", enabledTracks, disabledTracks);
    });
    this.webrtc?.on("onJoinError", (metadata) => {
      this.emit("onJoinError", metadata);
    });
    this.webrtc?.on("onBandwidthEstimationChanged", (estimation) => {
      this.emit("onBandwidthEstimationChanged", estimation);
    });
  }

  private setupCallbacks2() {
    const callbacks: Omit<Required<Callbacks>, "onSendMediaEvent"> = this.createCallbacks();
    let keyCallback: keyof typeof callbacks;
    for (keyCallback in callbacks) {
      const callback = callbacks[keyCallback];
      this.webrtc?.on(keyCallback, callback);
    }
  }

  private createCallbacks(): Omit<Required<Callbacks>, "onSendMediaEvent"> {
    return {
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

      // ...(includeOnTrackEncodingChanged && {
      onTrackEncodingChanged: (peerId, trackId, encoding) => {
        this.emit("onTrackEncodingChanged", peerId, trackId, encoding);
      },
      // }),
    };
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
