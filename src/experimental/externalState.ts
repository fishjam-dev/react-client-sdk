import type { SetStore, State } from "../state.types";
import { Dispatch } from "react";
import { Action } from "../reducer";

export type ExternalState<PeerMetadata, TrackMetadata> = {
  getSnapshot: () => State<PeerMetadata, TrackMetadata>;
  setStore: SetStore<PeerMetadata, TrackMetadata>;
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
  subscribe: (onStoreChange: () => void) => () => void;
};

export type Subscribe = (onStoreChange: () => void) => () => void;
export type Listener = () => void;

/**
 * Create store with initial state.
 *
 * @returns object with methods to get and set store
 */
export const createStore = <PeerMetadata, TrackMetadata>(): ExternalState<PeerMetadata, TrackMetadata> => {
  type StateType = State<PeerMetadata, TrackMetadata>;

  let listeners: Listener[] = [];
  let store: null = null;

  const getSnapshot = (): StateType => {
    // @ts-ignore
    return store;
  };

  const subscribe: (onStoreChange: () => void) => () => void = (callback: Listener) => {
    listeners = [...listeners, callback];

    return () => {
      listeners = listeners.filter((e) => e !== callback);
    };
  };

  const setStore = (setter: (prevState: StateType) => StateType) => {
    // @ts-ignore
    store = setter(store);

    listeners.forEach((listener) => {
      listener();
    });
  };

  const dispatch = (action: Action<PeerMetadata, TrackMetadata>) => {
    // @ts-ignore
    store = reducer<PeerMetadata, TrackMetadata>(store, action);

    listeners.forEach((listener) => {
      listener();
    });
  };

  return { getSnapshot, subscribe, setStore, dispatch };
};
