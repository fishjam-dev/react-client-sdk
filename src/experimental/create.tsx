import type { ExternalState } from "./externalState";
import { createStore } from "./externalState";
import { useSelector } from "./useSelector";
import type { Selector } from "../state.types";
import { useMemo } from "react";
import { connect } from "../connect";
import { Config } from "@jellyfish-dev/ts-client-sdk";

export type CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> = {
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  connect2: (config: Config<PeerMetadata>) => () => void;
};

/**
 * Create a client that can be used without a context.
 *
 * @returns client
 *
 */
export const create = <PeerMetadata, TrackMetadata>(): CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> => {
  const store: ExternalState<PeerMetadata, TrackMetadata> = createStore<PeerMetadata, TrackMetadata>();

  const connect2 = connect(store.setStore);

  return {
    useConnect: () => {
      return useMemo(() => {
        return connect(store.setStore);
      }, []);
    },
    connect2,

    useSelector: <Result,>(selector: Selector<PeerMetadata, TrackMetadata, Result>): Result => {
      return useSelector(store, selector);
    },
  };
};
