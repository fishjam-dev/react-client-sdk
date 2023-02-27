import { useCallback, useEffect, useState } from "react";
import { createNoContextMembraneClient } from "../../../src/externalState";
import { PeerMetadata, TrackMetadata } from "./setup";
import { createStream } from "./createMockStream";
import VideoPlayer from "./VideoPlayer";

type ClientProps = {
  id: number;
  name: string;
  emoji: string;
};

const roomId = "1";

type Disconnect = null | (() => void);

export const useMockStream = (emoji: string) => {
  const [result, setResult] = useState<{
    stop: () => void;
    stream: MediaStream;
  } | null>(null);

  const start = useCallback(() => {
    const result = createStream(emoji, "black", 24);
    setResult(result);
  }, []);

  const stop = useCallback(() => {
    result?.stop();
    setResult(null);
  }, [result]);

  return {
    start,
    stop: stop,
    stream: result?.stream,
  };
};

const Client = ({ id, name, emoji }: ClientProps) => {
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
    <article style={{ width: "500px", margin: "8px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
        className="grid"
      >
        <span>
          Client {id}: {emoji}
          {name}
        </span>
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
                `room:${roomId}`,
                { name: emoji + name },
                true
              );
              setDisconnect(() => disconnect);
            }}
          >
            Connect
          </button>
        )}

        {mockStream.stream && (
          <VideoPlayer
            stream={mockStream.stream}
            innerStyles={{ objectFit: "fill" }}
          />
        )}
      </div>
      <div className="grid">
        <button
          disabled={!mockStream.stream || fullState.status !== "connected"}
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
type Theme = "dark" | "light";
export const isThemeType = (value: string | undefined | null): value is Theme =>
  value === "dark" || value === "white";

const getLastSelectedTheme = (): Theme => {
  const theme = localStorage.getItem("theme");
  return isThemeType(theme) ? theme : "light";
};
const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    getLastSelectedTheme()
  );

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  useEffect(() => {
    const html = document.getElementsByTagName("html")?.[0];
    if (!html) return;
    html.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  return (
    <button
      style={{
        position: "fixed",
        bottom: "8px",
        right: "8px",
        display: "inline",
        width: "initial",
      }}
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
    >
      Toggle theme
    </button>
  );
};

const App = () => {
  const [clients] = useState<ClientProps[]>([
    { id: 1, name: "apple", emoji: "🍎" },
    { id: 2, name: "banana", emoji: "🍌" },
    { id: 3, name: "cherry", emoji: "🍒" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      <ThemeSelector />
      {clients.map(({ id, name, emoji }) => {
        return <Client key={id} id={id} name={name} emoji={emoji} />;
      })}
      <article style={{ margin: "8px", width: "500px" }}></article>
    </div>
  );
};

export default App;
