import { useState } from "react";
import { createNoContextMembraneClient } from "../../../src/externalState";
import { PeerMetadata, TrackMetadata } from "./setup";

type ClientProps = {
  id: number;
  name: string;
};

const roomId = "1";

const Client = ({ id, name }: ClientProps) => {
  const [client] = useState(
    createNoContextMembraneClient<PeerMetadata, TrackMetadata>()
  );
  const connect = client.useConnect();
  const fullState = client.useSelector((snapshot) => ({
    local: snapshot.local,
    remote: snapshot.remote,
    bandwidthEstimation: snapshot.bandwidthEstimation,
    status: snapshot.status,
  }));

  return (
    <article style={{ width: "500px", margin: "8px" }}>
      <span>
        Client {id}: {name}
      </span>
      <button
        onClick={() => {
          connect(`room:${roomId}`, { name: name }, true);
        }}
      >
        Connect
      </button>
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
    </article>
  );
};

const App = () => {
  const [clients] = useState<ClientProps[]>([
    { id: 1, name: "🍎apple" },
    { id: 2, name: "🍌banana" },
    { id: 3, name: "🍒cherry" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      {clients.map(({ id, name }) => {
        return <Client key={id} id={id} name={name} />;
      })}
      <article style={{ margin: "8px", width: "500px" }}></article>
    </div>
  );
};

export default App;
