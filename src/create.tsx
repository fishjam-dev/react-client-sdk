import {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useMemo,
  useReducer,
  JSX,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { Selector, State } from "./state.types";
import { createEmptyApi, DEFAULT_STORE } from "./state";
import {
  addTrack,
  onAuthError,
  onAuthSuccess,
  onBandwidthEstimationChanged,
  onEncodingChanged,
  onJoinError,
  onJoinSuccess,
  onPeerJoined,
  onPeerLeft,
  onPeerRemoved,
  onPeerUpdated,
  onSocketError,
  onSocketOpen,
  onTrackAdded,
  onTrackReady,
  onTrackRemoved,
  onTracksPriorityChanged,
  onTrackUpdated,
  onVoiceActivityChanged,
  removeTrack,
  replaceTrack,
  updateTrackMetadata,
} from "./stateMappers";
import { Api, createApiWrapper } from "./api";
import { Endpoint, SimulcastConfig, TrackBandwidthLimit, TrackContext } from "@jellyfish-dev/ts-client-sdk";
import { Config, JellyfishClient } from "@jellyfish-dev/ts-client-sdk";
import { PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
import { useUserMedia } from "./useUserMedia";
import { Type, UseUserMedia, UseUserMediaConfig } from "./useUserMedia/types";
import * as cluster from "cluster";
import * as stream from "stream";

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
  connectivity: {
    api: null,
    client: new JellyfishClient<PeerMetadata, TrackMetadata>(),
  },
});

export type ConnectAction<PeerMetadata, TrackMetadata> = {
  type: "connect";
  config: Config<PeerMetadata>;
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
};

export type DisconnectAction = {
  type: "disconnect";
};

export type OnJoinErrorAction = {
  type: "onJoinError";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
};

export type OnSocketErrorAction = {
  type: "onSocketError";
};

export type OnAuthErrorAction = {
  type: "onAuthError";
};

export type OnJoinSuccessAction<PeerMetadata> = {
  type: "onJoinSuccess";
  peerMetadata: PeerMetadata;
  peersInRoom: Endpoint[];
  peerId: string;
};

export type OnAuthSuccessAction = {
  type: "onAuthSuccess";
};

export type OnSocketOpenAction = {
  type: "onSocketOpen";
};
export type OnRemovedAction = {
  type: "onRemoved";
  reason: string;
};

export type OnDisconnectedAction = {
  type: "onDisconnected";
};

export type OnTrackAddedAction = {
  type: "onTrackAdded";
  ctx: TrackContext;
};

export type OnTrackReadyAction = {
  type: "onTrackReady";
  ctx: TrackContext;
};

export type OnTrackUpdatedAction = {
  type: "onTrackUpdated";
  ctx: TrackContext;
};

export type OnTrackRemovedAction = {
  type: "onTrackRemoved";
  ctx: TrackContext;
};

export type OnTrackEncodingChange = {
  type: "encodingChanged";
  ctx: TrackContext;
};

export type OnTrackVoiceActivityChanged = {
  type: "voiceActivityChanged";
  ctx: TrackContext;
};

export type OnBandwidthEstimationChangedAction = {
  type: "onBandwidthEstimationChanged";
  estimation: bigint;
};

export type OnTracksPriorityChangedAction = {
  type: "onTracksPriorityChanged";
  enabledTracks: TrackContext[];
  disabledTracks: TrackContext[];
};

export type OnPeerJoinedAction = {
  type: "onPeerJoined";
  peer: Endpoint;
};

export type OnPeerLeftAction = {
  type: "onPeerLeft";
  peer: Endpoint;
};

export type OnPeerUpdatedAction = {
  type: "onPeerUpdated";
  peer: Endpoint;
};

// Local
export type LocalAddTrackAction<TrackMetadata> = {
  type: "localAddTrack";
  remoteTrackId: string;
  track: MediaStreamTrack;
  stream: MediaStream;
  trackMetadata?: TrackMetadata;
  simulcastConfig?: SimulcastConfig;
};

export type LocalReplaceTrackAction<TrackMetadata> = {
  type: "localReplaceTrack";
  trackId: string;
  newTrack: MediaStreamTrack;
  stream: MediaStream;
  newTrackMetadata?: TrackMetadata;
};

export type LocalRemoveTrackAction = {
  type: "localRemoveTrack";
  trackId: string;
};

export type LocalUpdateTrackMetadataAction<TrackMetadata> = {
  type: "localUpdateTrackMetadata";
  trackId: string;
  trackMetadata: TrackMetadata;
};

export type Action<PeerMetadata, TrackMetadata> =
  | ConnectAction<PeerMetadata, TrackMetadata>
  | DisconnectAction
  | OnJoinSuccessAction<PeerMetadata>
  | OnAuthSuccessAction
  | OnAuthErrorAction
  | OnSocketOpenAction
  | OnSocketErrorAction
  | OnDisconnectedAction
  | OnRemovedAction
  | OnTrackReadyAction
  | OnTrackAddedAction
  | OnTrackUpdatedAction
  | OnTrackRemovedAction
  | OnTrackEncodingChange
  | OnTrackVoiceActivityChanged
  | OnBandwidthEstimationChangedAction
  | OnTracksPriorityChangedAction
  | OnPeerJoinedAction
  | OnPeerUpdatedAction
  | OnPeerLeftAction
  | OnJoinErrorAction
  | LocalReplaceTrackAction<TrackMetadata>
  | LocalRemoveTrackAction
  | LocalUpdateTrackMetadataAction<TrackMetadata>
  | LocalAddTrackAction<TrackMetadata>;

const onConnect = <PeerMetadata, TrackMetadata>(
  state: State<PeerMetadata, TrackMetadata>,
  action: ConnectAction<PeerMetadata, TrackMetadata>
): State<PeerMetadata, TrackMetadata> => {
  const client: JellyfishClient<PeerMetadata, TrackMetadata> | null = state?.connectivity.client;

  const { peerMetadata } = action.config;

  if (client === null) {
    console.log({ state, action });
    throw Error("Client is null");
  }

  const api = state?.connectivity.api ? state?.connectivity.api : createApiWrapper(client, action.dispatch);

  if (client?.status === "initialized") {
    return {
      ...state,
      status: "connecting",
      connectivity: {
        ...state.connectivity,
        api,
        client,
      },
    };
  }

  client.on("socketOpen", () => {
    action.dispatch({ type: "onSocketOpen" });
  });

  client.on("socketError", () => {
    action.dispatch({ type: "onSocketError" });
  });

  client.on("authSuccess", () => {
    action.dispatch({ type: "onAuthSuccess" });
  });

  client.on("authError", () => {
    action.dispatch({ type: "onAuthError" });
  });

  client.on("disconnected", () => {
    action.dispatch({ type: "onDisconnected" });
  });

  // important jeżeli użytkownik zapnie się na eventy z JellyfishClient
  //  to one mogą się odpalić wcześniej niż te tutaj zasetupowane metody
  //  tak się dzieje na przykład z eventem joined gdy chcę od razu zacząć
  //  przesyłać tracki zaraz po dołączeniu
  client.on("joined", (peerId: string, peersInRoom: Endpoint[]) => {
    action.dispatch({ type: "onJoinSuccess", peersInRoom, peerId, peerMetadata });
  });
  // todo handle state and handle callback
  client.on("joinError", (metadata) => {
    action.dispatch({ type: "onJoinError", metadata });
  });
  client.on("peerJoined", (peer) => {
    action.dispatch({ type: "onPeerJoined", peer });
  });
  client.on("peerUpdated", (peer) => {
    action.dispatch({ type: "onPeerUpdated", peer });
  });
  client.on("peerLeft", (peer) => {
    action.dispatch({ type: "onPeerLeft", peer });
  });
  client.on("trackReady", (ctx) => {
    action.dispatch({ type: "onTrackReady", ctx });
  });
  client.on("trackAdded", (ctx) => {
    action.dispatch({ type: "onTrackAdded", ctx });

    ctx.on("encodingChanged", () => {
      action.dispatch({ type: "encodingChanged", ctx });
    });
    ctx.on("voiceActivityChanged", () => {
      action.dispatch({ type: "voiceActivityChanged", ctx });
    });
  });
  client.on("trackRemoved", (ctx) => {
    action.dispatch({ type: "onTrackRemoved", ctx });
    ctx.removeAllListeners();
  });
  client.on("trackUpdated", (ctx) => {
    action.dispatch({ type: "onTrackUpdated", ctx });
  });
  client.on("bandwidthEstimationChanged", (estimation) => {
    action.dispatch({ type: "onBandwidthEstimationChanged", estimation });
  });
  // todo handle state
  client.on("tracksPriorityChanged", (enabledTracks, disabledTracks) => {
    action.dispatch({ type: "onTracksPriorityChanged", enabledTracks, disabledTracks });
  });

  client.connect(action.config);

  return {
    ...state,
    status: "connecting",
    connectivity: {
      api,
      client,
    },
  };
};

export const reducer = <PeerMetadata, TrackMetadata>(
  state: State<PeerMetadata, TrackMetadata>,
  action: Action<PeerMetadata, TrackMetadata>
): State<PeerMetadata, TrackMetadata> => {
  console.log({ name: "reducer", action });

  switch (action.type) {
    // Internal events
    case "connect":
      return onConnect<PeerMetadata, TrackMetadata>(state, action);
    case "disconnect":
      state?.connectivity?.client?.removeAllListeners();
      state?.connectivity?.client?.cleanUp();
      return createDefaultState();
    // connections events
    case "onSocketOpen":
      return onSocketOpen<PeerMetadata, TrackMetadata>()(state);
    case "onSocketError":
      return onSocketError<PeerMetadata, TrackMetadata>()(state);
    case "onJoinSuccess":
      return onJoinSuccess<PeerMetadata, TrackMetadata>(action.peersInRoom, action.peerId, action.peerMetadata)(state);
    case "onJoinError":
      return onJoinError<PeerMetadata, TrackMetadata>(action.metadata)(state);
    case "onDisconnected":
      state?.connectivity?.client?.removeAllListeners();
      state?.connectivity?.client?.cleanUp();
      // return onDisconnected<PeerMetadata, TrackMetadata>()(state)
      return createDefaultState();
    case "onAuthSuccess":
      return onAuthSuccess<PeerMetadata, TrackMetadata>()(state);
    case "onAuthError":
      return onAuthError<PeerMetadata, TrackMetadata>()(state);
    case "onRemoved":
      return onPeerRemoved<PeerMetadata, TrackMetadata>(action.reason)(state);
    // this peer events
    case "onBandwidthEstimationChanged":
      return onBandwidthEstimationChanged<PeerMetadata, TrackMetadata>(action.estimation)(state);
    // remote peers events
    case "onPeerJoined":
      return onPeerJoined<PeerMetadata, TrackMetadata>(action.peer)(state);
    case "onPeerUpdated":
      return onPeerUpdated<PeerMetadata, TrackMetadata>(action.peer)(state);
    case "onPeerLeft":
      return onPeerLeft<PeerMetadata, TrackMetadata>(action.peer)(state);
    // remote track events
    case "onTrackAdded":
      return onTrackAdded<PeerMetadata, TrackMetadata>(action.ctx)(state);
    case "onTrackReady":
      return onTrackReady<PeerMetadata, TrackMetadata>(action.ctx)(state);
    case "onTrackUpdated":
      return onTrackUpdated<PeerMetadata, TrackMetadata>(state, action.ctx);
    case "onTrackRemoved":
      return onTrackRemoved<PeerMetadata, TrackMetadata>(state, action.ctx);
    case "encodingChanged":
      return onEncodingChanged<PeerMetadata, TrackMetadata>(state, action.ctx);
    case "voiceActivityChanged":
      return onVoiceActivityChanged<PeerMetadata, TrackMetadata>(action.ctx)(state);
    // local track events
    case "localAddTrack":
      const newVar = addTrack<PeerMetadata, TrackMetadata>(
        action.remoteTrackId,
        action.track,
        action.stream,
        action.trackMetadata,
        action.simulcastConfig
      )(state);

      console.log({ name: "new state after local add track", oldState: state, newState: newVar, action });
      return newVar;
    case "localRemoveTrack":
      return removeTrack<PeerMetadata, TrackMetadata>(action.trackId)(state);
    case "localReplaceTrack":
      return replaceTrack<PeerMetadata, TrackMetadata>(
        action.trackId,
        action.newTrack,
        action.stream,
        action.newTrackMetadata
      )(state);
    case "localUpdateTrackMetadata":
      return updateTrackMetadata<PeerMetadata, TrackMetadata>(action.trackId, action.trackMetadata)(state);
    case "onTracksPriorityChanged":
      return onTracksPriorityChanged<PeerMetadata, TrackMetadata>(action.enabledTracks, action.disabledTracks)(state);
  }
  throw Error("Unhandled Action");
};

type Reducer<PeerMetadata, TrackMetadata> = (
  state: State<PeerMetadata, TrackMetadata>,
  action: Action<PeerMetadata, TrackMetadata>
) => State<PeerMetadata, TrackMetadata>;

export type UseCameraAndMicrophoneConfig<TrackMetadata> = UseUserMediaConfig & {
  streamWhenConnected?: boolean;
  startStreamingWhenDeviceReady?: boolean;
};

export type UseCameraAndMicrophoneResult<TrackMetadata> = UseUserMedia & {
  addTrack: (
    type: Type,
    trackMetadata?: TrackMetadata,
    simulcastConfig?: SimulcastConfig,
    maxBandwidth?: TrackBandwidthLimit
  ) => void;
  removeTrack: (type: Type) => void;
  replaceTrack: (
    type: Type,
    newTrack: MediaStreamTrack,
    stream: MediaStream,
    newTrackMetadata?: TrackMetadata
  ) => Promise<boolean>;
};

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useApi: () => Api<TrackMetadata>;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<TrackMetadata>>;
  useCameraAndMicrophone: (
    config: UseCameraAndMicrophoneConfig<TrackMetadata>
  ) => UseCameraAndMicrophoneResult<TrackMetadata>;
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
    const [state, dispatch] = useReducer<Reducer<PeerMetadata, TrackMetadata>, State<PeerMetadata, TrackMetadata>>(
      reducer,
      DEFAULT_STORE,
      () => createDefaultState()
    );

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

  const useApi = () => useSelector((s) => s.connectivity.api || createEmptyApi<TrackMetadata>());
  const useStatus = () => useSelector((s) => s.status);
  const useTracks = () => useSelector((s) => s.tracks);

  // todo removeTrack when device is disabled
  // todo replaceTrack when device is replaced
  const useCameraAndMicrophone = (
    config: UseCameraAndMicrophoneConfig<TrackMetadata>
  ): UseCameraAndMicrophoneResult<TrackMetadata> => {
    const { state } = useJellyfishContext();
    const result = useUserMedia(config);

    useEffect(() => {
      console.log({ result });
    }, [result]);

    const mediaRef = useRef(result);
    const apiRef = useRef(state.connectivity.api);

    useEffect(() => {
      mediaRef.current = result;
      apiRef.current = state.connectivity.api;
    }, [result, state.connectivity.api]);

    const videoTrackIdRef = useRef<string | null>(null);
    const audioTrackIdRef = useRef<string | null>(null);

    const addTrack = useCallback(
      (
        type: Type,
        trackMetadata?: TrackMetadata,
        simulcastConfig?: SimulcastConfig,
        maxBandwidth?: TrackBandwidthLimit
      ) => {
        if (!apiRef.current) return;

        const trackIdRef = type === "video" ? videoTrackIdRef : audioTrackIdRef;
        if (trackIdRef.current) return;

        const deviceState = result.data?.[type];
        if (!deviceState || deviceState.status !== "OK") return;

        const track = deviceState.media?.track;
        const stream = deviceState.media?.stream;

        if (!track || !stream) return;

        trackIdRef.current = apiRef.current.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
      },
      [result]
    );

    // todo test this method
    const replaceTrack = useCallback(
      (
        type: Type,
        newTrack: MediaStreamTrack,
        stream: MediaStream,
        newTrackMetadata?: TrackMetadata
      ): Promise<boolean> => {
        if (!apiRef.current) return Promise.resolve<boolean>(false);

        const trackIdRef = type === "video" ? videoTrackIdRef : audioTrackIdRef;
        if (!trackIdRef.current) return Promise.resolve<boolean>(false);

        const deviceState = result.data?.[type];
        if (!deviceState || deviceState.status !== "OK") return Promise.resolve<boolean>(false);

        if (!newTrack || !stream) return Promise.resolve<boolean>(false);

        return apiRef.current?.replaceTrack(trackIdRef.current, newTrack, stream, newTrackMetadata);
      },
      [result]
    );

    // Start streaming onJoined,
    useEffect(() => {
      // todo implement audio track
      if (!config.streamWhenConnected || state.status !== "joined") return;
      const client = state.connectivity.client;

      addTrack(
        "video",
        undefined, // todo handle metadata
        undefined, // todo handle simulcast
        undefined // todo handle maxBandwidth
      );
    }, [state.status, config.streamWhenConnected, addTrack]);

    // Start streaming when device ready,
    useEffect(() => {
      // todo implement audio track
      if (!config.startStreamingWhenDeviceReady || result.data?.video.status !== "OK") return;

      addTrack(
        "video",
        undefined, // todo handle metadata
        undefined, // todo handle simulcast
        undefined // todo handle maxBandwidth
      );

      return () => {};
    }, [result.data?.video.status]);

    const removeTrack = useCallback((type: Type) => {
      const trackIdRef = type === "video" ? videoTrackIdRef : audioTrackIdRef;
      if (!trackIdRef.current || !apiRef.current) return;
      apiRef.current.removeTrack(trackIdRef.current);
      trackIdRef.current = null;
    }, []);

    useEffect(() => {
      console.log({ name: "Id changed!", deviceId: result.data?.video?.media?.deviceInfo?.deviceId });

      if (!apiRef.current) return;
      const track = result.data?.video?.media?.track;
      const stream = result.data?.video?.media?.stream;
      console.log({ name: "Api exist", track, stream, trackId: videoTrackIdRef.current });

      if (videoTrackIdRef.current && track && stream) {
        // obecnie jest nadawany track
        console.log({ name: "Replace track" });
        // todo track metadata
        if (!videoTrackIdRef.current || !apiRef?.current) return;
        apiRef.current.replaceTrack(videoTrackIdRef.current, track, stream, undefined);
      }
      // todo here implement track removing
    }, [result.data?.video?.media?.deviceInfo?.deviceId]);

    return useMemo(
      () => ({
        ...result,
        addTrack,
        removeTrack,
        replaceTrack,
      }),
      [result, addTrack, removeTrack]
    );
  };

  return {
    JellyfishContextProvider,
    useSelector,
    useConnect,
    useDisconnect,
    useApi,
    useStatus,
    useTracks,
    useCameraAndMicrophone,
  };
};
