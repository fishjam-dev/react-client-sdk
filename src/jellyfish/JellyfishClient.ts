import { SetStore, State } from "../state.types";
import { Channel, Socket } from "phoenix";
import {
  MembraneWebRTC,
  Peer,
  SerializedMediaEvent,
  TrackContext,
} from "@jellyfish-dev/membrane-webrtc-js";
import { Api, createApiWrapper } from "../api";
import { DEFAULT_STORE } from "../externalState/externalState";
import { ConnectConfig } from "./jellyfishConnect";
import TypedEmitter from "typed-emitter";
import { EventEmitter } from "events";
import { Callbacks } from "@jellyfish-dev/membrane-webrtc-js/dist/membraneWebRTC";

type MessageEvents = Omit<Callbacks, "onSendMediaEvent">;

export class JellyfishClient {
  messageEmitter: TypedEmitter<MessageEvents>;

  constructor() {
    this.messageEmitter = new EventEmitter() as TypedEmitter<MessageEvents>;
  }

  connect<PeerMetadata, TrackMetadata>(
    setStore: SetStore<PeerMetadata, TrackMetadata>
  ) {
    return (
      roomId: string,
      peerMetadata: PeerMetadata,
      isSimulcastOn: boolean,
      config?: ConnectConfig
    ): (() => void) => {
      console.log("Connecting...2");
      const websocketUrl = config?.websocketUrl ?? "/socket";

      // client
      const socket = new Socket(websocketUrl);
      socket.connect();
      const socketOnCloseRef = socket.onClose(() => cleanUp());
      const socketOnErrorRef = socket.onError(() => cleanUp());

      const signaling: Channel = socket.channel(roomId, {
        isSimulcastOn: isSimulcastOn,
      });

      signaling.onError((reason: any) => {
        console.error("WebrtcChannel error occurred");
        console.error(reason);
        // setErrorMessage("WebrtcChannel error occurred");
      });
      signaling.onClose(() => {
        return;
      });

      const includeOnTrackEncodingChanged = !config?.disableDeprecated;

      const webrtc = new MembraneWebRTC({
        callbacks: {
          onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
            signaling.push("mediaEvent", { data: mediaEvent });
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

          // todo handle state and handle callback
          onJoinError: (metadata) => {
            this.messageEmitter.emit("onJoinError", metadata);
          },

          onBandwidthEstimationChanged: (estimation) => {
            this.messageEmitter.emit(
              "onBandwidthEstimationChanged",
              estimation
            );
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
      const api: Api<TrackMetadata> = createApiWrapper(webrtc, setStore);

      signaling.on("mediaEvent", (event) => {
        webrtc.receiveMediaEvent(event.data);
      });

      signaling.on("simulcastConfig", () => {
        return;
      });

      setStore(
        (
          prevState: State<PeerMetadata, TrackMetadata>
        ): State<PeerMetadata, TrackMetadata> => {
          return {
            ...prevState,
            status: "connecting",
            connectivity: {
              ...prevState.connectivity,
              socket: socket,
              api: api,
              webrtc: webrtc,
              signaling: signaling,
            },
          };
        }
      );

      signaling
        .join()
        .receive("ok", () => {
          webrtc.join(peerMetadata);
        })
        .receive("error", (response: any) => {
          // setErrorMessage("Connecting error");
          console.error("Received error status");
          console.error(response);
        });

      const cleanUp = () => {
        setStore(() => DEFAULT_STORE);

        webrtc.leave();
        signaling.leave();
        socket.off([socketOnCloseRef, socketOnErrorRef]);
      };

      return () => {
        cleanUp();
      };
    };
  }
}
