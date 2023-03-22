import { createNoContextMembraneClient, DEFAULT_MEMBRANE_CLIENT_CONFIG } from "../../../src/externalState";

// import { createMembraneClient } from "membrane-react-webrtc-client";

const TrackTypeValues = ["screensharing", "camera", "audio"] as const;
export type TrackType = (typeof TrackTypeValues)[number];

export type PeerMetadata = {
  name: string;
};
export type TrackMetadata = {
  type: TrackType;
  active: boolean;
};

export const { useConnect, useSelector } = createNoContextMembraneClient<PeerMetadata, TrackMetadata>(
  DEFAULT_MEMBRANE_CLIENT_CONFIG
);

// Remember to use MembraneContextProvider in main.tsx
// export const { MembraneContextProvider, useSelector, useConnect } = createMembraneClient<PeerMetadata, TrackMetadata>();
