import { create } from "@jellyfish-dev/jellyfish-react-client/experimental";

const TrackTypeValues = ["screensharing", "camera", "audio"] as const;
export type TrackType = (typeof TrackTypeValues)[number];

export type PeerMetadata = {
  name: string;
};
export type TrackMetadata = {
  type: TrackType;
  active: boolean;
};

export const { useConnect, useSelector } = create<PeerMetadata, TrackMetadata>();

// Remember to use MembraneContextProvider in main.tsx
// export const { MembraneContextProvider, useSelector, useConnect } = createMembraneClient<PeerMetadata, TrackMetadata>();
