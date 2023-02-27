import { Channel, MessageRef, Socket } from "phoenix";
import {
  MembraneWebRTC,
  Peer,
  SerializedMediaEvent,
  TrackContext,
} from "@jellyfish-dev/membrane-webrtc-js";
import TypedEmitter from "typed-emitter";
import { EventEmitter } from "events";
import { Callbacks } from "@jellyfish-dev/membrane-webrtc-js/dist/membraneWebRTC";

type MessageEvents = Omit<Callbacks, "onSendMediaEvent">;

export type ConnectConfig = {
  websocketUrl?: string;
  disableDeprecated?: boolean;
};

export class JellyfishClient<PeerMetadata, TrackMetadata> {
  socket: Socket | null = null;
  signaling: Channel | null = null;
  webrtc: MembraneWebRTC | null = null;
  socketOnCloseRef: MessageRef | null = null;
  socketOnErrorRef: MessageRef | null = null;
  messageEmitter: TypedEmitter<MessageEvents>;

  constructor() {
    this.messageEmitter = new EventEmitter() as TypedEmitter<MessageEvents>;
  }

  connect(
    roomId: string,
    peerMetadata: PeerMetadata,
    isSimulcastOn: boolean,
    config?: ConnectConfig
  ) {
    const websocketUrl = config?.websocketUrl ?? "/socket";

    // client
    this.socket = new Socket(websocketUrl);
    this.socket.connect();
    this.socketOnCloseRef = this.socket.onClose(() => this.cleanUp());
    this.socketOnErrorRef = this.socket.onError(() => this.cleanUp());

    this.signaling = this.socket.channel(roomId, {
      isSimulcastOn: isSimulcastOn,
    });

    this.signaling.onError((reason: any) => {
      console.error("WebrtcChannel error occurred");
      console.error(reason);
      // setErrorMessage("WebrtcChannel error occurred");
    });
    this.signaling.onClose(() => {
      return;
    });

    const includeOnTrackEncodingChanged = !config?.disableDeprecated;

    this.webrtc = new MembraneWebRTC({
      callbacks: {
        onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
          this.signaling?.push("mediaEvent", { data: mediaEvent });
        },

        onConnectionError: (message) => {
          return;
        },

        // todo [Peer] -> Peer[] ???
        onJoinSuccess: (peerId, peersInRoom: [Peer]) => {
          this.messageEmitter.emit("onJoinSuccess", peerId, peersInRoom);
        },

        onRemoved: (reason) => {
          this.messageEmitter.emit("onRemoved", reason);
        },

        onPeerJoined: (peer) => {
          this.messageEmitter.emit("onPeerJoined", peer);
        },

        onPeerLeft: (peer) => {
          this.messageEmitter.emit("onPeerLeft", peer);
        },

        onPeerUpdated: (peer: Peer) => {
          this.messageEmitter.emit("onPeerUpdated", peer);
        },

        onTrackReady: (ctx) => {
          this.messageEmitter.emit("onTrackReady", ctx);
        },

        onTrackAdded: (ctx) => {
          this.messageEmitter.emit("onTrackAdded", ctx);
        },

        onTrackRemoved: (ctx) => {
          this.messageEmitter.emit("onTrackRemoved", ctx);
        },

        onTrackUpdated: (ctx: TrackContext) => {
          this.messageEmitter.emit("onTrackUpdated", ctx);
        },

        onTracksPriorityChanged: (
          enabledTracks: TrackContext[],
          disabledTracks: TrackContext[]
        ) => {
          this.messageEmitter.emit(
            "onTracksPriorityChanged",
            enabledTracks,
            disabledTracks
          );
        },

        onJoinError: (metadata) => {
          this.messageEmitter.emit("onJoinError", metadata);
        },

        onBandwidthEstimationChanged: (estimation) => {
          this.messageEmitter.emit("onBandwidthEstimationChanged", estimation);
        },

        ...(includeOnTrackEncodingChanged && {
          onTrackEncodingChanged: (peerId, trackId, encoding) => {
            this.messageEmitter.emit(
              "onTrackEncodingChanged",
              peerId,
              trackId,
              encoding
            );
          },
        }),
      },
    });

    this.signaling.on("mediaEvent", (event) => {
      this.webrtc?.receiveMediaEvent(event.data);
    });

    this.signaling.on("simulcastConfig", () => {
      return;
    });

    this.signaling
      .join()
      .receive("ok", () => {
        this.webrtc?.join(peerMetadata);
      })
      .receive("error", (response: any) => {
        // setErrorMessage("Connecting error");
        console.error("Received error status");
        console.error(response);
      });
  }

  cleanUp() {
    this.webrtc?.leave();
    this.signaling?.leave();
    if (this.socketOnCloseRef) {
      this.socket?.off([this.socketOnCloseRef]);
    }
    if (this.socketOnErrorRef) {
      this.socket?.off([this.socketOnErrorRef]);
    }
  }
}
