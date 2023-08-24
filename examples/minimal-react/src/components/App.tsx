import VideoPlayer from "./VideoPlayer";
import { SCREEN_SHARING_MEDIA_CONSTRAINTS } from "@jellyfish-dev/browser-media-utils";
import { Peer, create, JellyfishClient } from "@jellyfish-dev/react-client-sdk";

// Example metadata types for peer and track
// You can define your own metadata types just make sure they are serializable
export type PeerMetadata = {
  name: string;
};

export type TrackMetadata = {
  type: "camera" | "screen";
};

// Create a Membrane client instance
// remember to use JellyfishContextProvider
export const { useApi, useStatus, useSelector, useConnect, JellyfishContextProvider } = create<
  PeerMetadata,
  TrackMetadata
>();

// Start the peer connection
const peerToken = prompt("Enter peer token") ?? null;

export const App = () => {
  // Create the connect function
  const connect = useConnect();

  const remoteTracks = useSelector((snapshot) => Object.values(snapshot?.tracks || {}));
  const api = useApi();
  const status = useStatus();

  // Render the remote tracks from other peers
  return (
    <div>
      <button
        onClick={() => {
          if (!peerToken) throw Error("Token is empty");
          connect({
            peerMetadata: { name: "peer" },
            token: peerToken,
            signaling: { host: "localhost:5002", protocol: "ws" },
          });
        }}
      >
        Join
      </button>
      <button
        disabled={status !== "joined"}
        onClick={() => {
          // Create a new MediaStream to add tracks to
          const localStream: MediaStream = new MediaStream();

          // Get screen sharing MediaStream
          navigator.mediaDevices.getDisplayMedia(SCREEN_SHARING_MEDIA_CONSTRAINTS).then((screenStream) => {
            // Add tracks from screen sharing MediaStream to local MediaStream
            screenStream.getTracks().forEach((track) => localStream.addTrack(track));

            // Add local MediaStream to webrtc
            localStream.getTracks().forEach((track) => api.addTrack(track, localStream, { type: "screen" }));
          });
        }}
      >
        Start screen share
      </button>
      {remoteTracks.map(({ stream, trackId }) => (
        <VideoPlayer key={trackId} stream={stream} /> // Simple component to render a video element
      ))}
    </div>
  );
};
