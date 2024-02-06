import {
  createContext,
  Dispatch,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Selector, State } from "./state.types";
import { PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
import { createEmptyApi, DEFAULT_STORE } from "./state";
import { Api } from "./api";
import { Config, JellyfishClient, TrackContextEvents, WebRTCEndpointEvents } from "@jellyfish-dev/ts-client-sdk";
import { INITIAL_STATE } from "./useUserMedia";
import { Action, createDefaultDevices, Reducer, reducer } from "./reducer";
import { useSetupMedia as useSetupMediaInternal } from "./useMedia";
import {
  UseCameraAndMicrophoneResult,
  UseCameraResult,
  UseMicrophoneResult,
  UseScreenshareResult,
  UseSetupMediaConfig,
  UseSetupMediaResult,
} from "./useMedia/types";
import { INITIAL_STATE as SCREENSHARE_INITIAL_STATE } from "./useMedia/screenshare";

export type JellyfishContextProviderProps = {
  children: ReactNode;
};

type JellyfishContextType<PeerMetadata, TrackMetadata> = {
  state: State<PeerMetadata, TrackMetadata>;
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
};

export type UseConnect<PeerMetadata> = (config: Config<PeerMetadata>) => () => void;

export const createDefaultState = <PeerMetadata, TrackMetadata>(): State<PeerMetadata, TrackMetadata> => ({
  local: null,
  remote: {},
  status: null,
  tracks: {},
  bandwidthEstimation: BigInt(0), // todo investigate bigint n notation
  media: INITIAL_STATE,
  devices: createDefaultDevices(),
  connectivity: {
    api: null,
    client: new JellyfishClient<PeerMetadata, TrackMetadata>(),
  },
  screenshare: SCREENSHARE_INITIAL_STATE,
});

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useApi: () => Api<PeerMetadata, TrackMetadata>;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<TrackMetadata>>;
  useSetupMedia: (config: UseSetupMediaConfig<TrackMetadata>) => UseSetupMediaResult;
  useCamera: () => UseCameraAndMicrophoneResult<TrackMetadata>["camera"];
  useMicrophone: () => UseCameraAndMicrophoneResult<TrackMetadata>["microphone"];
  useScreenshare: () => UseScreenshareResult<TrackMetadata>;
};

/**
 * Create a client that can be used with a context.
 * Returns context provider, and two hooks to interact with the context.
 *
 * @returns ContextProvider, useSelector, useConnect
 */
export const create = <PeerMetadata, TrackMetadata>(): CreateJellyfishClient<PeerMetadata, TrackMetadata> => {
  const JellyfishContext = createContext<JellyfishContextType<PeerMetadata, TrackMetadata> | undefined>(undefined);

  const JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element = ({
    children,
  }: JellyfishContextProviderProps) => {
    // const [state, dispatch] = useReducer<Reducer<PeerMetadata, TrackMetadata>, State<PeerMetadata, TrackMetadata>>(
    //   reducer,
    //   DEFAULT_STORE,
    //   () => createDefaultState(),
    // );
    const prevStore = useRef(createDefaultState<PeerMetadata, TrackMetadata>());
    const clientRef = useRef(prevStore.current.connectivity.client);

    const subscribe = useCallback((cb: () => void) => {
      const client = clientRef.current;

      console.log("Subscribe function invoked");

      if (!client) return () => {};

      console.log("Setting up listeners");

      const callback = () => cb();

      client.on("socketClose", callback);
      client.on("socketError", callback);
      client.on("socketOpen", callback);
      client.on("authSuccess", callback);
      client.on("authError", callback);
      client.on("disconnected", callback);
      client.on("joined", callback);
      client.on("joinError", callback);
      client.on("peerJoined", callback);
      client.on("peerLeft", callback);
      client.on("peerUpdated", callback);
      client.on("connectionError", callback);
      client.on("tracksPriorityChanged", callback);
      client.on("bandwidthEstimationChanged", callback);

      // tracks callbacks

      const trackCb: TrackContextEvents["encodingChanged"] = () => cb();

      const trackAddedCb: WebRTCEndpointEvents["trackAdded"] = (context) => {
        context.on("encodingChanged", () => trackCb);
        context.on("voiceActivityChanged", () => trackCb);

        callback();
      };

      const removeCb: WebRTCEndpointEvents["trackRemoved"] = (context) => {
        context.removeListener("encodingChanged", () => trackCb);
        context.removeListener("voiceActivityChanged", () => trackCb);

        callback();
      };

      client.on("trackAdded", trackAddedCb);
      client.on("trackReady", cb);
      client.on("trackUpdated", cb);
      client.on("trackRemoved", removeCb);

      // invoke cb if something changed

      return () => {
        // cleanup function
        console.log("Cleaning up listeners");

        client.removeListener("socketClose", callback);
        client.removeListener("socketError", callback);
        client.removeListener("socketOpen", callback);
        client.removeListener("authSuccess", callback);
        client.removeListener("authError", callback);
        client.removeListener("disconnected", callback);
        client.removeListener("joined", callback);
        client.removeListener("joinError", callback);
        client.removeListener("peerJoined", callback);
        client.removeListener("peerLeft", callback);
        client.removeListener("peerUpdated", callback);
        client.removeListener("connectionError", callback);
        client.removeListener("tracksPriorityChanged", callback);
        client.removeListener("bandwidthEstimationChanged", callback);

        client.removeListener("trackAdded", trackAddedCb);
        client.removeListener("trackReady", cb);
        client.removeListener("trackUpdated", cb);
        client.removeListener("trackRemoved", removeCb);
      };
    }, []);

    const getSnapshot: () => State<PeerMetadata, TrackMetadata> = useCallback(() => {
      return prevStore.current;
    }, []);

    const state = useSyncExternalStore(subscribe, getSnapshot);

    const dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>> = useCallback((action) => {
      console.log({ action });
      const newStore = reducer(prevStore.current, action);
      prevStore.current = newStore;
    }, []);

    return <JellyfishContext.Provider value={{ state, dispatch }}>{children}</JellyfishContext.Provider>;
  };

  const useJellyfishContext = (): JellyfishContextType<PeerMetadata, TrackMetadata> => {
    const context = useContext(JellyfishContext);
    if (!context) throw new Error("useJellyfishContext must be used within a JellyfishContextProvider");
    return context;
  };

  const useSelector = <Result,>(selector: Selector<PeerMetadata, TrackMetadata, Result>): Result => {
    const { state } = useJellyfishContext();

    return useMemo(() => selector(state), [selector, state]);
  };

  const useConnect = (): UseConnect<PeerMetadata> => {
    const { dispatch }: JellyfishContextType<PeerMetadata, TrackMetadata> = useJellyfishContext();

    return useMemo(() => {
      return (config: Config<PeerMetadata>): (() => void) => {
        dispatch({ type: "connect", config, dispatch });
        return () => {
          dispatch({ type: "disconnect" });
        };
      };
    }, [dispatch]);
  };

  const useDisconnect = () => {
    const { dispatch }: JellyfishContextType<PeerMetadata, TrackMetadata> = useJellyfishContext();

    return useCallback(() => {
      dispatch({ type: "disconnect" });
    }, [dispatch]);
  };

  const useApi = () => useSelector((s) => s.connectivity.api || createEmptyApi<PeerMetadata, TrackMetadata>());
  const useStatus = () => useSelector((s) => s.status);
  const useTracks = () => useSelector((s) => s.tracks);

  const useCamera = (): UseCameraResult<TrackMetadata> => {
    const { state } = useJellyfishContext();

    return state.devices.camera;
  };

  const useMicrophone = (): UseMicrophoneResult<TrackMetadata> => {
    const { state } = useJellyfishContext();

    return state.devices.microphone;
  };

  const useSetupMedia = (config: UseSetupMediaConfig<TrackMetadata>): UseSetupMediaResult => {
    const { state, dispatch } = useJellyfishContext();

    return useSetupMediaInternal(state, dispatch, config);
  };

  const useScreenshare = () => {
    const { state } = useJellyfishContext();
    return state.devices.screenshare;
  };

  return {
    JellyfishContextProvider,
    useSelector,
    useConnect,
    useDisconnect,
    useApi,
    useStatus,
    useTracks,
    useSetupMedia,
    useCamera,
    useMicrophone,
    useScreenshare,
  };
};
