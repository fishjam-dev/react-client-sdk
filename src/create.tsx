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
} from "react";
import type { Selector, State, Track } from "./state.types";
import { PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
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
import {
  Config,
  Endpoint,
  JellyfishClient,
  SimulcastConfig,
  TrackBandwidthLimit,
  TrackContext,
} from "@jellyfish-dev/ts-client-sdk";
import { useUserMedia } from "./useUserMedia";
import { DeviceError, DevicePersistence, DeviceReturnType, Type, UseUserMediaStartConfig } from "./useUserMedia/types";
import { AUDIO_TRACK_CONSTRAINTS, VIDEO_TRACK_CONSTRAINTS } from "./useUserMedia/constraints";

export type JellyfishContextProviderProps = {
  children: ReactNode;
};

type JellyfishContextType<PeerMetadata, TrackMetadata> = {
  state: State<PeerMetadata, TrackMetadata>;
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>;
  useSetupCameraAndMicrophone: (config: useSetupCameraAndMicrophoneConfig) => UseCameraAndMicrophoneInitialize;
  useCamera: (config: UseCameraConfig<TrackMetadata>) => UseCameraResult<TrackMetadata>;
  useMicrophone: (config: UseMicrophoneConfig<TrackMetadata>) => UseMicrophoneResult<TrackMetadata>;
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
  userMediaConfig: {
    storage: true,
    startOnMount: false,
    audioTrackConstraints: AUDIO_TRACK_CONSTRAINTS,
    videoTrackConstraints: VIDEO_TRACK_CONSTRAINTS,
  },
  userMediaTracks: { videoTrackIdRef: null, audioTrackIdRef: null },
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
      return addTrack<PeerMetadata, TrackMetadata>(
        action.remoteTrackId,
        action.track,
        action.stream,
        action.trackMetadata,
        action.simulcastConfig
      )(state);
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

export type UseMicrophoneConfig<TrackMetadata> = {
  microphone: {
    autoStreaming?: boolean;
    preview?: boolean;
    trackConstraints: boolean | MediaTrackConstraints;
    defaultTrackMetadata?: TrackMetadata;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
  startOnMount?: boolean;
  storage?: boolean | DevicePersistence;
};

export type useSetupCameraAndMicrophoneConfig = {
  startOnMount?: boolean;
  storage?: boolean | DevicePersistence;
  cameraTrackConstraints: boolean | MediaTrackConstraints;
  microphoneTrackConstraints: boolean | MediaTrackConstraints;
};

export type UseCameraConfig<TrackMetadata> = {
  camera: {
    autoStreaming?: boolean;
    preview?: boolean;
    trackConstraints: boolean | MediaTrackConstraints;
    defaultTrackMetadata?: TrackMetadata;
    defaultSimulcastConfig?: SimulcastConfig;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
};

export type UseCameraAndMicrophoneInitialize = {
  init: () => void;
};

export type UseCameraResult<TrackMetadata> = {
  video: {
    stop: () => void;
    setEnable: (value: boolean) => void;
    start: () => void; // startByType
    addTrack: (
      trackMetadata?: TrackMetadata,
      simulcastConfig?: SimulcastConfig,
      maxBandwidth?: TrackBandwidthLimit
    ) => void; // remote
    removeTrack: () => void; // remote
    replaceTrack: (
      newTrack: MediaStreamTrack,
      stream: MediaStream,
      newTrackMetadata?: TrackMetadata
    ) => Promise<boolean>; // remote
    broadcast: Track<TrackMetadata> | null;
    status: DeviceReturnType | null; // todo how to remove null
    stream: MediaStream | null;
    track: MediaStreamTrack | null;
    enabled: boolean;
    deviceInfo: MediaDeviceInfo | null;
    error: DeviceError | null;
    devices: MediaDeviceInfo[] | null;
  };
  startVideo: (config: UseUserMediaStartConfig) => void;
};

export type UseMicrophoneResult<TrackMetadata> = {
  audio: {
    stop: () => void;
    setEnable: (value: boolean) => void;
    start: () => void; // startByType
    addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) => void;
    removeTrack: () => void;
    replaceTrack: (
      newTrack: MediaStreamTrack,
      stream: MediaStream,
      newTrackMetadata?: TrackMetadata
    ) => Promise<boolean>;
    broadcast: Track<TrackMetadata> | null;
    status: DeviceReturnType | null;
    stream: MediaStream | null;
    track: MediaStreamTrack | null;
    enabled: boolean;
    deviceInfo: MediaDeviceInfo | null;
    error: DeviceError | null;
    devices: MediaDeviceInfo[] | null;
  };
  startAudio: (config: UseUserMediaStartConfig) => void;
};

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useApi: () => Api<TrackMetadata>;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<TrackMetadata>>;
  useJellyfishContext: () => JellyfishContextType<PeerMetadata, TrackMetadata>;
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

    const result = useUserMedia(state.userMediaConfig);

    const useSetupCameraAndMicrophone = (
      config: useSetupCameraAndMicrophoneConfig
    ): UseCameraAndMicrophoneInitialize => {
      useEffect(() => {
        state.userMediaConfig = {
          storage: config.storage,
          startOnMount: config.startOnMount,
          audioTrackConstraints: config.microphoneTrackConstraints,
          videoTrackConstraints: config.cameraTrackConstraints,
        };
      }, [config]);

      return useMemo(
        () => ({
          init: result.init,
        }),
        []
      );
    };

    const useCamera = (config: UseCameraConfig<TrackMetadata>): UseCameraResult<TrackMetadata> => {
      const mediaRef = useRef(result);
      const apiRef = useRef(state.connectivity.api);

      useEffect(() => {
        mediaRef.current = result;
        apiRef.current = state.connectivity.api;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.connectivity.api, result]);

      const videoTrackIdRef = useRef<string | null>(null);

      useEffect(() => {
        videoTrackIdRef.current = state.userMediaTracks?.videoTrackIdRef || null;
      }, []);

      const addTrack = useCallback(
        (
          type: Type,
          trackMetadata?: TrackMetadata,
          simulcastConfig?: SimulcastConfig,
          maxBandwidth?: TrackBandwidthLimit
        ) => {
          if (!apiRef.current) return;

          const trackIdRef = videoTrackIdRef;
          if (trackIdRef.current) return;

          const deviceState = mediaRef.current.data?.[type];
          if (!deviceState || deviceState.status !== "OK") return;

          const track = deviceState.media?.track;
          const stream = deviceState.media?.stream;

          if (!track || !stream) return;

          trackIdRef.current = apiRef.current.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
        },
        []
      );

      useEffect(() => {
        if (state.status !== "joined") {
          videoTrackIdRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.status]);

      const replaceTrack = useCallback(
        (
          type: Type,
          newTrack: MediaStreamTrack,
          stream: MediaStream,
          newTrackMetadata?: TrackMetadata
        ): Promise<boolean> => {
          if (!apiRef.current) return Promise.resolve<boolean>(false);

          const trackIdRef = videoTrackIdRef;
          if (!trackIdRef.current) return Promise.resolve<boolean>(false);

          const deviceState = result.data?.[type];
          if (!deviceState || deviceState.status !== "OK") return Promise.resolve<boolean>(false);

          if (!newTrack || !stream) return Promise.resolve<boolean>(false);

          return apiRef.current?.replaceTrack(trackIdRef.current, newTrack, stream, newTrackMetadata);
        },
        []
      );

      useEffect(() => {
        if (state.status !== "joined") return;

        if (config.camera.autoStreaming && mediaRef.current.data?.video.status === "OK") {
          addTrack(
            "video",
            config.camera.defaultTrackMetadata,
            config.camera.defaultSimulcastConfig,
            config.camera.defaultMaxBandwidth
          );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.status, config.camera.autoStreaming, addTrack]);

      const removeTrack = useCallback(() => {
        const trackIdRef = videoTrackIdRef;
        if (!trackIdRef.current || !apiRef.current) return;
        apiRef.current.removeTrack(trackIdRef.current);
        trackIdRef.current = null;
      }, []);

      useEffect(() => {
        if (!apiRef.current) return;

        const videoTrack = result.data?.video?.media?.track;
        const videoStream = result.data?.video?.media?.stream;

        const cameraPreview = config.camera.preview ?? true;

        if (!cameraPreview && result.data?.video.status === "OK") {
          addTrack(
            "video",
            config.camera.defaultTrackMetadata,
            config.camera.defaultSimulcastConfig,
            config.camera.defaultMaxBandwidth
          );
        } else if (videoTrackIdRef.current && videoTrack && videoStream) {
          // todo track metadata
          if (!videoTrackIdRef.current) return;
          replaceTrack("video", videoTrack, videoStream, undefined);
        } else if (videoTrackIdRef.current && !videoTrack && !videoStream) {
          // todo add nullify option
          if (videoTrackIdRef.current == null) return;
          removeTrack();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [result.data?.video?.media?.deviceInfo?.deviceId, replaceTrack]);

      const startByType = useCallback(
        (type: Type) => {
          result.start(type === "video" ? { videoDeviceId: true } : { audioDeviceId: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result.start]
      );

      const video =
        videoTrackIdRef.current && state.local?.tracks ? state.local?.tracks[videoTrackIdRef.current] : null;

      return useMemo(
        () => ({
          startVideo: result.start,
          video: {
            stop: () => result.stop("video"),
            setEnable: (value: boolean) => result.setEnable("video", value),
            start: () => startByType("video"),
            addTrack: (
              trackMetadata?: TrackMetadata,
              simulcastConfig?: SimulcastConfig,
              maxBandwidth?: TrackBandwidthLimit
            ) => addTrack("video", trackMetadata, simulcastConfig, maxBandwidth),
            removeTrack: removeTrack,
            replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) =>
              replaceTrack("video", newTrack, stream, newTrackMetadata),
            broadcast: video,
            status: result.data?.video?.status || null,
            stream: result.data?.video.media?.stream || null,
            track: result.data?.video.media?.track || null,
            enabled: result.data?.video.media?.enabled || false,
            deviceInfo: result.data?.video.media?.deviceInfo || null,
            error: result.data?.video?.error || null,
            devices: result.data?.video?.devices || null,
          },
        }),
        [video, startByType, addTrack, removeTrack, replaceTrack]
      );
    };

    const useMicrophone = (config: UseMicrophoneConfig<TrackMetadata>): UseMicrophoneResult<TrackMetadata> => {
      const mediaRef = useRef(result);
      const apiRef = useRef(state.connectivity.api);

      useEffect(() => {
        mediaRef.current = result;
        apiRef.current = state.connectivity.api;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.connectivity.api, result]);

      const audioTrackIdRef = useRef<string | null>(null);

      useEffect(() => {
        audioTrackIdRef.current = state.userMediaTracks?.audioTrackIdRef || null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.userMediaTracks?.audioTrackIdRef]);

      const addTrack = useCallback(
        (
          type: Type,
          trackMetadata?: TrackMetadata,
          simulcastConfig?: SimulcastConfig,
          maxBandwidth?: TrackBandwidthLimit
        ) => {
          if (!apiRef.current) return;

          const trackIdRef = audioTrackIdRef;
          if (trackIdRef.current) return;

          const deviceState = mediaRef.current.data?.[type];
          if (!deviceState || deviceState.status !== "OK") return;

          const track = deviceState.media?.track;
          const stream = deviceState.media?.stream;

          if (!track || !stream) return;
          trackIdRef.current = apiRef.current.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
        },
        []
      );

      useEffect(() => {
        if (state.status !== "joined") {
          audioTrackIdRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.status]);

      const replaceTrack = useCallback(
        (
          type: Type,
          newTrack: MediaStreamTrack,
          stream: MediaStream,
          newTrackMetadata?: TrackMetadata
        ): Promise<boolean> => {
          if (!apiRef.current) return Promise.resolve<boolean>(false);

          const trackIdRef = audioTrackIdRef;
          if (!trackIdRef.current) return Promise.resolve<boolean>(false);

          const deviceState = result.data?.[type];
          if (!deviceState || deviceState.status !== "OK") return Promise.resolve<boolean>(false);

          if (!newTrack || !stream) return Promise.resolve<boolean>(false);

          return apiRef.current?.replaceTrack(trackIdRef.current, newTrack, stream, newTrackMetadata);
        },
        []
      );

      useEffect(() => {
        if (state.status !== "joined") return;

        if (config.microphone.autoStreaming && mediaRef.current.data?.audio.status === "OK") {
          addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [state.status, config.microphone.autoStreaming, addTrack]);

      const removeTrack = useCallback(() => {
        const trackIdRef = audioTrackIdRef;
        if (!trackIdRef.current || !apiRef.current) return;
        apiRef.current.removeTrack(trackIdRef.current);
        trackIdRef.current = null;
      }, []);

      useEffect(() => {
        if (!apiRef.current) return;

        const audioTrack = result.data?.audio?.media?.track;
        const audioStream = result.data?.audio?.media?.stream;

        const microphonePreview = config.microphone.preview ?? true;

        if (!microphonePreview && result.data?.audio.status === "OK") {
          addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
        } else if (audioTrackIdRef.current && audioTrack && audioStream) {
          // todo track metadata
          if (!audioTrackIdRef.current) return;
          replaceTrack("audio", audioTrack, audioStream, undefined);
        } else if (audioTrackIdRef.current && !audioTrack && !audioStream) {
          // todo add nullify option

          removeTrack();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [result.data?.video?.media?.deviceInfo?.deviceId, replaceTrack]);

      const startByType = useCallback(
        (type: Type) => {
          result.start(type === "video" ? { videoDeviceId: true } : { audioDeviceId: true });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result.start]
      );

      const audio =
        audioTrackIdRef.current && state.local?.tracks ? state.local?.tracks[audioTrackIdRef.current] : null;

      return useMemo(
        () => ({
          startAudio: result.start,
          audio: {
            stop: () => result.stop("audio"),
            setEnable: (value: boolean) => result.setEnable("audio", value),
            start: () => startByType("audio"),
            addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) =>
              addTrack("audio", trackMetadata, undefined, maxBandwidth),
            removeTrack: removeTrack,
            replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) =>
              replaceTrack("audio", newTrack, stream, newTrackMetadata),
            broadcast: audio,
            status: result.data?.audio?.status || null,
            stream: result.data?.audio.media?.stream || null,
            track: result.data?.audio.media?.track || null,
            enabled: result.data?.audio.media?.enabled || false,
            deviceInfo: result.data?.audio.media?.deviceInfo || null,
            error: result.data?.audio?.error || null,
            devices: result.data?.audio?.devices || null,
          },
        }),
        [removeTrack, audio, startByType, addTrack, replaceTrack]
      );
    };

    return (
      <JellyfishContext.Provider value={{ state, dispatch, useCamera, useMicrophone, useSetupCameraAndMicrophone }}>
        {children}
      </JellyfishContext.Provider>
    );
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

  return {
    JellyfishContextProvider,
    useSelector,
    useConnect,
    useDisconnect,
    useApi,
    useStatus,
    useTracks,
    useJellyfishContext,
  };
};
