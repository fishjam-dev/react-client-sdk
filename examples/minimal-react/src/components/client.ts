import { create } from "@fishjam-dev/react-client-sdk";
import { PeerMetadata, TrackMetadata } from "./App";

// Create a Membrane client instance
// remember to use FishjamContextProvider
export const { useClient, useTracks, useStatus, useConnect, useDisconnect, useSelector, FishjamContextProvider } =
  create<PeerMetadata, TrackMetadata>();
