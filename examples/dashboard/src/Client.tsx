import { useEffect, useState } from "react";
import { createNoContextMembraneClient } from "../../../src/externalState";
import { PeerMetadata, TrackMetadata } from "./setup";
import { useMockStream } from "./UseMockStream";
import VideoPlayer from "./VideoPlayer";

type ClientProps = {
  roomId: string;
  peerId: string;
  name: string;
  emoji: string;
};

type Disconnect = null | (() => void);

export const Client = ({ roomId, peerId, name, emoji }: ClientProps) => {
  const [client] = useState(
    createNoContextMembraneClient<PeerMetadata, TrackMetadata>()
  );
  const connect = client.useConnect();
  const [disconnect, setDisconnect] = useState<Disconnect>(() => null);
  const fullState = client.useSelector((snapshot) => ({
    local: snapshot.local,
    remote: snapshot.remote,
    bandwidthEstimation: snapshot.bandwidthEstimation,
    status: snapshot.status,
  }));
  const api = client.useSelector((snapshot) => snapshot.connectivity.api);

  const mockStream = useMockStream(emoji);
  const [trackId, setTrackId] = useState<null | string>(null);

  useEffect(() => {
    mockStream.start();
  }, []);

  return (
    <article className="m-2">
      <span>
        Client {peerId}: {emoji}
      </span>
      <div className="grid grid-cols-2">
        <div>
          {disconnect ? (
            <button
              onClick={() => {
                disconnect();
                setDisconnect(() => null);
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => {
                const disconnect = connect(
                  roomId,
                  peerId,
                  { name: name },
                  true,
                  { websocketUrl: "ws://localhost:4005/socket" }
                );
                setDisconnect(() => disconnect);
              }}
            >
              Connect
            </button>
          )}
        </div>

        {mockStream.stream && <VideoPlayer stream={mockStream.stream} />}
      </div>
      <div className="grid">
        <button
          // disabled={!mockStream.stream || fullState.status !== "connected"}
          onClick={() => {
            const track = mockStream.stream?.getVideoTracks()?.[0];
            const stream = mockStream.stream;
            if (!stream || !track) return;
            const trackId = api?.addTrack(track, stream, {
              type: "camera",
              active: true,
            });
            if (!trackId) throw Error("Adding track error!");

            setTrackId(trackId);
          }}
          style={{
            display: "inline",
            width: "initial",
          }}
        >
          Add track
        </button>
        <button
          disabled={fullState.status !== "connected" || trackId === null}
          onClick={() => {
            if (!trackId) return;
            api?.removeTrack(trackId);
            setTrackId(null);
          }}
          style={{
            display: "inline",
            width: "initial",
          }}
        >
          Remove track
        </button>
      </div>
      <small>
        <pre>
          {JSON.stringify(
            fullState,
            (key, value) => {
              if (typeof value === "bigint") return value.toString();
              return value;
            },
            2
          )}
        </pre>
      </small>
      <div>
        {Object.values(fullState?.remote || {}).map(
          ({ id, metadata, tracks }) => {
            return (
              <div key={id}>
                <h4>
                  {id}: {metadata?.name}
                </h4>
                <div>
                  {Object.values(tracks || {}).map(({ stream, trackId }) => (
                    <VideoPlayer key={trackId} stream={stream} />
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>
    </article>
  );
};
