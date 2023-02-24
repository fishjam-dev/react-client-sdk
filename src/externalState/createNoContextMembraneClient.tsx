import type { ExternalState } from "./externalState";
import { createStore } from "./externalState";
import { useSelector } from "./useSelector";
import type { Selector } from "../state.types";
import { useMemo } from "react";
import { connect } from "../connect";

export const createNoContextMembraneClient = <PeerMetadata, TrackMetadata>() => {
  const store: ExternalState<PeerMetadata, TrackMetadata> = createStore<
    PeerMetadata,
    TrackMetadata
  >();

  return {
    useConnect: () => {
      return useMemo(() => connect(store.setStore), []);
    },
    useSelector: <Result, >(selector: Selector<PeerMetadata, TrackMetadata, Result>): Result => {
      return useSelector(store, selector);
    },
  };
};
