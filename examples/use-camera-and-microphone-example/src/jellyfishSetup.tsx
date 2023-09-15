import { create } from "@jellyfish-dev/react-client-sdk";

export type PeerMetadata = {
  name: string;
};

export type TrackMetadata = {
  type: "camera" | "microphone";
  mode: "auto" | "manual";
};

export const {
  useApi,
  useTracks,
  useStatus,
  useConnect,
  useDisconnect,
  useSelector,
  useJellyfishContext,
  JellyfishContextProvider,
} = create<PeerMetadata, TrackMetadata>();
