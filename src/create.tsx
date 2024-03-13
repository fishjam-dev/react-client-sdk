import {
  createContext,
  Dispatch,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Selector, State, Track } from "./state.types";
import { PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
import { createEmptyApi } from "./state";
import { Api } from "./api";
import { CreateConfig, ConnectConfig, JellyfishClient, Endpoint } from "@jellyfish-dev/ts-client-sdk";
import { INITIAL_STATE } from "./useUserMedia";
// import { Action, createDefaultDevices, reducer } from "./reducer";
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
import TypedEmitter from "typed-emitter/rxjs";
import EventEmitter from "events";
import { Client } from "./Client";

export type JellyfishContextProviderProps = {
  children: ReactNode;
};

type JellyfishContextType<PeerMetadata, TrackMetadata> = {
  state: State<PeerMetadata, TrackMetadata>;
  // dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
};

export type UseConnect<PeerMetadata> = (config: ConnectConfig<PeerMetadata>) => () => void;

// export const createDefaultState = <PeerMetadata, TrackMetadata>(
//   config?: CreateConfig<PeerMetadata, TrackMetadata>,
// ): State<PeerMetadata, TrackMetadata> => ({
//   client: new Client<PeerMetadata, TrackMetadata>(),
//   local: null,
//   remote: {},
//   status: null,
//   tracks: {},
//   bandwidthEstimation: 0n,
//   media: INITIAL_STATE,
//   devices: createDefaultDevices() | null,
//   connectivity: {
//     api: null,
//     client: new JellyfishClient<PeerMetadata, TrackMetadata>(config),
//   },
//   screenshare: SCREENSHARE_INITIAL_STATE,
// });

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: ConnectConfig<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useApi: () => Api<PeerMetadata, TrackMetadata>;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;
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
export const create = <PeerMetadata, TrackMetadata>(
  config?: CreateConfig<PeerMetadata, TrackMetadata>,
): CreateJellyfishClient<PeerMetadata, TrackMetadata> => {
  const JellyfishContext = createContext<JellyfishContextType<PeerMetadata, TrackMetadata> | undefined>(undefined);

  type StateChangeEvents = {
    stateChanged: () => void;
  };
  const messageEmitter = new EventEmitter() as TypedEmitter<StateChangeEvents>;

  const JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element = ({
    children,
  }: JellyfishContextProviderProps) => {
    // const prevStore = useRef(createDefaultState<PeerMetadata, TrackMetadata>());
    const clientRef = useRef(new Client<PeerMetadata, TrackMetadata>());

    const subscribe = useCallback((cb: () => void) => {
      console.log("Subscribe function invoked");

      const client = clientRef.current;
      const callback = () => cb();

      console.log("Setting up listeners");
      client.on("socketOpen", callback);
      client.on("socketError", callback);
      client.on("socketClose", callback);
      client.on("authSuccess", callback);
      client.on("authError", callback);
      client.on("disconnected", callback);
      client.on("joined", callback);
      client.on("joinError", callback);
      client.on("peerJoined", callback);
      client.on("peerUpdated", callback);
      client.on("peerLeft", callback);
      client.on("trackReady", callback);
      client.on("trackAdded", callback);
      client.on("trackRemoved", callback);
      client.on("trackUpdated", callback);
      client.on("bandwidthEstimationChanged", callback);

      client.on("encodingChanged", callback);
      client.on("voiceActivityChanged", callback);

      client.on("deviceDisabled", callback);
      client.on("deviceEnabled", callback);
      client.on("managerInitialized", callback);
      client.on("managerStarted", callback);
      client.on("deviceStopped", callback);
      client.on("deviceReady", callback);
      client.on("devicesReady", callback);
      client.on("error", callback);

      const customCallback = (...args: any[]) => {
        console.log("Custom callback");
        console.log({ args });
        callback()
      };

      client.on("localTrackAdded", customCallback);
      client.on("localTrackReplaced", customCallback);
      client.on("localTrackRemoved", customCallback);

      return () => {
        console.log("Cleaning up listeners");

        client.removeListener("socketOpen", callback);
        client.removeListener("socketError", callback);
        client.removeListener("socketClose", callback);
        client.removeListener("authSuccess", callback);
        client.removeListener("authError", callback);
        client.removeListener("disconnected", callback);
        client.removeListener("joined", callback);
        client.removeListener("joinError", callback);
        client.removeListener("peerJoined", callback);
        client.removeListener("peerUpdated", callback);
        client.removeListener("peerLeft", callback);
        client.removeListener("trackReady", callback);
        client.removeListener("trackAdded", callback);
        client.removeListener("trackRemoved", callback);
        client.removeListener("trackUpdated", callback);
        client.removeListener("bandwidthEstimationChanged", callback);

        client.removeListener("encodingChanged", callback);
        client.removeListener("voiceActivityChanged", callback);

        client.removeListener("deviceDisabled", callback);
        client.removeListener("deviceEnabled", callback);
        client.removeListener("managerInitialized", callback);
        client.removeListener("managerStarted", callback);
        client.removeListener("deviceStopped", callback);
        client.removeListener("deviceReady", callback);
        client.removeListener("devicesReady", callback);
        client.removeListener("error", callback);

        client.removeListener("localTrackAdded", customCallback);
        client.removeListener("localTrackReplaced", customCallback);
        client.removeListener("localTrackRemoved", customCallback);
      };
    }, []);

    const getSnapshot: () => State<PeerMetadata, TrackMetadata> = useCallback(() => {
      return clientRef.current.getSnapshot();
    }, []);

    const state = useSyncExternalStore(subscribe, getSnapshot);

    useEffect(() => {
      console.log({ syncState: state });
    }, [state]);

    // const dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>> = useCallback((action) => {
    //   prevStore.current = reducer(prevStore.current, action);
    //
    //   messageEmitter.emit("stateChanged");
    // }, []);

    return <JellyfishContext.Provider value={{ state }}>{children}</JellyfishContext.Provider>;
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
    const { state }: JellyfishContextType<PeerMetadata, TrackMetadata> = useJellyfishContext();

    return useMemo(() => {
      return (config: ConnectConfig<PeerMetadata>): (() => void) => {
        state.client.connect(config);
        return () => {
          state.client.disconnect();
        };
      };
    }, [state.client]);
  };

  const useDisconnect = () => {
    const { state }: JellyfishContextType<PeerMetadata, TrackMetadata> = useJellyfishContext();

    return useCallback(() => {
      state.client.disconnect();
    }, [state.client]);
  };

  // todo fix or remove
  const useApi = () => useSelector((s) => createEmptyApi<PeerMetadata, TrackMetadata>());
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
    const { state } = useJellyfishContext();

    return useMemo(() => ({ init: () => state.devices.init() }), [state.devices.init]);
  };

  const useScreenshare = (): UseScreenshareResult<TrackMetadata> => {
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
