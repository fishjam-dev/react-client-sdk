import type { ExternalState } from "./externalState";
import { createStore } from "./externalState";
import { useSelector } from "./useSelector";
import type { Selector } from "../state.types";
import { useMemo } from "react";
import { Config } from "@jellyfish-dev/ts-client-sdk";
import { TrackEncoding } from "@jellyfish-dev/membrane-webrtc-js";

export type CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> = {
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useBandwidthEstimation: () => bigint;
  updateTrackMetadata: ((trackId: string, trackMetadata: TrackMetadata) => void) | null;
  setTrackBandwidth: ((trackId: string, bandwidth: number) => Promise<boolean>) | null;
  setTargetTrackEncoding: ((trackId: string, encoding: TrackEncoding) => void) | null;
};

/**
 * Create a client that can be used without a context.
 *
 * @returns client
 *
 */
export const create = <PeerMetadata, TrackMetadata>(): CreateNoContextJellyfishClient<PeerMetadata, TrackMetadata> => {
  const store: ExternalState<PeerMetadata, TrackMetadata> = createStore<PeerMetadata, TrackMetadata>();

  return {
    useConnect: () => {
      // todo remove use memo?
      return useMemo(() => {
        const { dispatch } = store;
        return (config: Config<PeerMetadata>): (() => void) => {
          dispatch({ type: "connect", config, dispatch });
          return () => {
            dispatch({ type: "disconnect" });
          };
        };
      }, []);
    },
    useSelector: <Result,>(selector: Selector<PeerMetadata, TrackMetadata, Result>): Result => {
      return useSelector(store, selector);
    },
    /* eslint-disable react-hooks/rules-of-hooks */
    useBandwidthEstimation: () => useSelector(store, (snapshot) => snapshot.bandwidthEstimation),
    updateTrackMetadata: useSelector(store, (snapshot) => snapshot.connectivity.client?.updateTrackMetadata) ?? null,
    setTrackBandwidth: useSelector(store, (snapshot) => snapshot.connectivity.client?.setTrackBandwidth) ?? null,
    setTargetTrackEncoding:
      useSelector(store, (snapshot) => snapshot.connectivity.client?.setTargetTrackEncoding) ?? null,
    /* eslint-enable react-hooks/rules-of-hooks */
  };
};
