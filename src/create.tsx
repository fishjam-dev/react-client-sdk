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
import { Api } from "./api";
import { Config, JellyfishClient, SimulcastConfig, TrackBandwidthLimit } from "@jellyfish-dev/ts-client-sdk";
import { useUserMedia } from "./useUserMedia";
import {
  DeviceError,
  DevicePersistence,
  DeviceReturnType,
  Type,
  UseUserMediaConfig,
  UseUserMediaStartConfig,
} from "./useUserMedia/types";
import { Action, Reducer, reducer } from "./reducer";

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

export type UseCameraAndMicrophoneConfig<TrackMetadata> = {
  camera: {
    autoStreaming?: boolean;
    preview?: boolean;
    trackConstraints: boolean | MediaTrackConstraints;
    defaultTrackMetadata?: TrackMetadata;
    defaultSimulcastConfig?: SimulcastConfig;
    defaultMaxBandwidth?: TrackBandwidthLimit;
  };
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

export type UseCameraAndMicrophoneResult<TrackMetadata> = {
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
  init: () => void;
  start: (config: UseUserMediaStartConfig) => void;
};

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: Config<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useApi: () => Api<TrackMetadata>;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<TrackMetadata>>;

  /*
   * At this moment, this hook does not work with the context.
   */
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

  const useCameraAndMicrophone = (
    config: UseCameraAndMicrophoneConfig<TrackMetadata>
  ): UseCameraAndMicrophoneResult<TrackMetadata> => {
    const { state } = useJellyfishContext();

    const userMediaConfig: UseUserMediaConfig = useMemo(() => {
      return {
        storage: config.storage,
        startOnMount: config.startOnMount,
        audioTrackConstraints: config.microphone.trackConstraints,
        videoTrackConstraints: config.camera.trackConstraints,
      };
    }, [config]);

    const result = useUserMedia(userMediaConfig);

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
        audioTrackIdRef.current = null;
      }
    }, [state.status]);

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

        const deviceState = mediaRef?.current?.data?.[type];
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

      if (config.microphone.autoStreaming && mediaRef.current.data?.audio.status === "OK") {
        addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.status, config.camera.autoStreaming, config.microphone.autoStreaming, addTrack]);

    const removeTrack = useCallback((type: Type) => {
      const trackIdRef = type === "video" ? videoTrackIdRef : audioTrackIdRef;
      if (!trackIdRef.current || !apiRef.current) return;
      apiRef.current.removeTrack(trackIdRef.current);
      trackIdRef.current = null;
    }, []);

    useEffect(() => {
      if (!apiRef.current) return;
      const videoTrack = result.data?.video?.media?.track;
      const videoStream = result.data?.video?.media?.stream;

      const cameraPreview = config.camera.preview ?? true;

      if (!cameraPreview && result.data?.video.status === "OK" && result.data?.video.media?.stream) {
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
        removeTrack("video");
      }

      const audioTrack = result.data?.audio?.media?.track;
      const audioStream = result.data?.audio?.media?.stream;

      const microphonePreview = config.microphone.preview ?? true;

      if (!microphonePreview && result.data?.audio.status === "OK" && result.data?.audio.media?.stream) {
        addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
      } else if (audioTrackIdRef.current && audioTrack && audioStream) {
        // todo track metadata
        if (!audioTrackIdRef.current) return;
        replaceTrack("audio", audioTrack, audioStream, undefined);
      } else if (audioTrackIdRef.current && !audioTrack && !audioStream) {
        // todo add nullify option
        removeTrack("audio");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      result.data?.video?.media?.deviceInfo?.deviceId,
      result.data?.audio?.media?.deviceInfo?.deviceId,
      replaceTrack,
    ]);

    const startByType = useCallback(
      (type: Type) => {
        result.start(type === "video" ? { videoDeviceId: true } : { audioDeviceId: true });
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [result.start]
    );

    const video = useMemo(
      () => (videoTrackIdRef.current && state.local?.tracks ? state.local?.tracks[videoTrackIdRef.current] : null),
      [state]
    );

    const audio = useMemo(
      () => (!audioTrackIdRef.current || !state.local?.tracks ? null : state.local?.tracks[audioTrackIdRef.current]),
      [state]
    );

    return useMemo(
      () => ({
        init: result.init,
        start: result.start,
        video: {
          stop: () => {
            result.stop("video");
          },
          setEnable: (value: boolean) => result.setEnable("video", value),
          start: () => startByType("video"),
          addTrack: (
            trackMetadata?: TrackMetadata,
            simulcastConfig?: SimulcastConfig,
            maxBandwidth?: TrackBandwidthLimit
          ) => addTrack("video", trackMetadata, simulcastConfig, maxBandwidth),
          removeTrack: () => removeTrack("video"),
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
        audio: {
          stop: () => result.stop("audio"),
          setEnable: (value: boolean) => result.setEnable("audio", value),
          start: () => startByType("audio"),
          addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) =>
            addTrack("audio", trackMetadata, undefined, maxBandwidth),
          removeTrack: () => removeTrack("audio"),
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
      [result, video, audio, startByType, addTrack, removeTrack, replaceTrack]
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
