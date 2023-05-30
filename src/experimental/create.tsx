import type { ExternalState } from "./externalState";
import { createStore } from "./externalState";
import { useSelector } from "./useSelector";
import type { Selector } from "../state.types";
import { useMemo } from "react";
import { connect } from "../connect";
import { Config, JellyfishClient } from "@jellyfish-dev/ts-client-sdk";

export type CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> = {
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
};

/**
 * Create a client that can be used without a context.
 *
 * @returns client
 *
 */
export const create = <PeerMetadata, TrackMetadata>(): CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> => {
  const store: ExternalState<PeerMetadata, TrackMetadata> = createStore<PeerMetadata, TrackMetadata>();
  const clientWrapper: {
    current: JellyfishClient<PeerMetadata, TrackMetadata> | null;
  } = { current: store.getSnapshot().connectivity.client };

  return {
    useConnect: () => {
      return useMemo(() => {
        return connect(store.setStore, clientWrapper);
      }, []);
    },
    useSelector: <Result,>(selector: Selector<PeerMetadata, TrackMetadata, Result>): Result => {
      return useSelector(store, selector);
    },
  };
};
