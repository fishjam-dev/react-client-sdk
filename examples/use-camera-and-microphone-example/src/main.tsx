import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { create } from "@jellyfish-dev/react-client-sdk";

export type PeerMetadata = {
}

export type TrackMetadata = {
  type: "camera" | "microphone",
  mode: "auto" | "manual"
}

export const {
  useApi,
  useTracks,
  useStatus,
  useConnect,
  useDisconnect,
  JellyfishContextProvider,
  useCameraAndMicrophone,
  useSelector
} = create<PeerMetadata, TrackMetadata>();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JellyfishContextProvider>
      <App />
    </JellyfishContextProvider>
  </React.StrictMode>
);
