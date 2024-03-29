import {
  createContext,
  JSX,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { Selector, State } from "./state.types";
import { PeerStatus, TrackId, TrackWithOrigin } from "./state.types";
import { CreateConfig, ConnectConfig } from "@jellyfish-dev/ts-client-sdk";
import {
  UseCameraAndMicrophoneResult,
  UseCameraResult,
  UseMicrophoneResult,
  UseScreenShareResult,
  UseSetupMediaConfig,
  UseSetupMediaResult,
  DeviceManagerConfig,
} from "./types";
import { Client, ClientEvents, ReactClientCreteConfig } from "./Client";
import { ScreenShareManagerConfig } from "./ScreenShareManager";

export type JellyfishContextProviderProps = {
  children: ReactNode;
};

type JellyfishContextType<PeerMetadata, TrackMetadata> = {
  state: State<PeerMetadata, TrackMetadata>;
};

export type UseConnect<PeerMetadata> = (config: ConnectConfig<PeerMetadata>) => () => void;

export type CreateJellyfishClient<PeerMetadata, TrackMetadata> = {
  JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element;
  useConnect: () => (config: ConnectConfig<PeerMetadata>) => () => void;
  useDisconnect: () => () => void;
  useStatus: () => PeerStatus;
  useSelector: <Result>(selector: Selector<PeerMetadata, TrackMetadata, Result>) => Result;
  useTracks: () => Record<TrackId, TrackWithOrigin<PeerMetadata, TrackMetadata>>;
  useSetupMedia: (config: UseSetupMediaConfig<TrackMetadata>) => UseSetupMediaResult;
  useCamera: () => UseCameraAndMicrophoneResult<TrackMetadata>["camera"];
  useMicrophone: () => UseCameraAndMicrophoneResult<TrackMetadata>["microphone"];
  useScreenShare: () => UseScreenShareResult<TrackMetadata>;
};

/**
 * Create a client that can be used with a context.
 * Returns context provider, and two hooks to interact with the context.
 *
 * @returns ContextProvider, useSelector, useConnect
 */
export const create = <PeerMetadata, TrackMetadata>(
  config?: CreateConfig<PeerMetadata, TrackMetadata>,
  deviceManagerDefaultConfig?: DeviceManagerConfig,
  screenShareManagerDefaultConfig?: ScreenShareManagerConfig,
): CreateJellyfishClient<PeerMetadata, TrackMetadata> => {
  console.log("Create function invoked!");

  const JellyfishContext = createContext<JellyfishContextType<PeerMetadata, TrackMetadata> | undefined>(undefined);

  const JellyfishContextProvider: ({ children }: JellyfishContextProviderProps) => JSX.Element = ({
    children,
  }: JellyfishContextProviderProps) => {
    const memoClient = useMemo(() => {
      return new Client<PeerMetadata, TrackMetadata>({
        clientConfig: config,
        deviceManagerDefaultConfig,
        screenShareManagerDefaultConfig,
      });
    }, []);

    const clientRef = useRef(memoClient);

    const subscribe = useCallback((cb: () => void) => {
      const client = clientRef.current;
      const callback = () => cb();

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

      // todo remove
      const customCallback = () => {
        callback();
      };

      client.on("localTrackAdded", customCallback);
      client.on("localTrackReplaced", customCallback);
      client.on("localTrackRemoved", customCallback);

      return () => {
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
        console.log("React client connect");
        state.client.connect(config);
        return () => {
          console.log("React client disconnect");
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

  // create useClient

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

  // todo for now i skipped this config
  const useSetupMedia = (config: UseSetupMediaConfig<TrackMetadata>): UseSetupMediaResult => {
    const { state } = useJellyfishContext();

    if (config.screenShare.streamConfig) {
      state.client.setScreenManagerConfig(config.screenShare.streamConfig);
    }

    state.client.setDeviceManagerConfig({
      storage: config.storage,
    });

    useEffect(() => {
      if (config.startOnMount) {
        state.devices.init({
          audioTrackConstraints: config?.microphone?.trackConstraints,
          videoTrackConstraints: config?.camera?.trackConstraints,
        });
      }
      // eslint-disable-next-line
    }, []);

    useEffect(() => {
      const broadcastOnCameraStart: ClientEvents<PeerMetadata, TrackMetadata>["managerInitialized"] = async (
        _,
        client,
      ) => {
        const state = client.getSnapshot();
        if (state.status === "joined" && config.camera.broadcastOnDeviceStart) {
          await state.devices.camera.addTrack(
            config.camera.defaultTrackMetadata,
            config.camera.defaultSimulcastConfig,
            config.camera.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("managerInitialized", broadcastOnCameraStart);

      return () => {
        state.client.removeListener("managerInitialized", broadcastOnCameraStart);
      };
    }, [config.camera.broadcastOnDeviceStart]);

    useEffect(() => {
      const broadcastOnMicrophoneStart: ClientEvents<PeerMetadata, TrackMetadata>["managerInitialized"] = async (
        _,
        client,
      ) => {
        const state = client.getSnapshot();
        if (state.status === "joined" && config.microphone.broadcastOnDeviceStart) {
          await state.devices.microphone.addTrack(
            config.microphone.defaultTrackMetadata,
            config.microphone.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("managerInitialized", broadcastOnMicrophoneStart);

      return () => {
        state.client.removeListener("managerInitialized", broadcastOnMicrophoneStart);
      };
    }, [config.microphone.broadcastOnDeviceStart]);

    useEffect(() => {
      const broadcastOnScreenShareStart: ClientEvents<PeerMetadata, TrackMetadata>["deviceReady"] = async (
        _,
        client,
      ) => {
        const state = client.getSnapshot();
        if (state.status === "joined" && config.screenShare.broadcastOnDeviceStart) {
          await state.devices.screenShare.addTrack(
            config.screenShare.defaultTrackMetadata,
            config.screenShare.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("deviceReady", broadcastOnScreenShareStart);

      return () => {
        state.client.removeListener("deviceReady", broadcastOnScreenShareStart);
      };
    }, [config.screenShare.broadcastOnDeviceStart]);

    useEffect(() => {
      const broadcastCameraOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        const state = client.getSnapshot();

        if (state.devices.camera.stream && config.camera.broadcastOnConnect) {
          await state.devices.camera.addTrack(
            config.camera.defaultTrackMetadata,
            config.camera.defaultSimulcastConfig,
            config.camera.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("joined", broadcastCameraOnConnect);

      return () => {
        state.client.removeListener("joined", broadcastCameraOnConnect);
      };
    }, [config.camera.broadcastOnConnect]);

    useEffect(() => {
      const broadcastMicrophoneOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        const state = client.getSnapshot();

        if (state.devices.microphone.stream && config.microphone.broadcastOnConnect) {
          await state.devices.microphone.addTrack(
            config.microphone.defaultTrackMetadata,
            config.microphone.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("joined", broadcastMicrophoneOnConnect);

      return () => {
        state.client.removeListener("joined", broadcastMicrophoneOnConnect);
      };
    }, [config.microphone.broadcastOnConnect]);

    useEffect(() => {
      const broadcastScreenShareOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        const state = client.getSnapshot();

        if (state.devices.screenShare.stream && config.screenShare.broadcastOnConnect) {
          await state.devices.screenShare.addTrack(
            config.screenShare.defaultTrackMetadata,
            config.screenShare.defaultMaxBandwidth,
          );
        }
      };

      state.client.on("joined", broadcastScreenShareOnConnect);

      return () => {
        state.client.removeListener("joined", broadcastScreenShareOnConnect);
      };
    }, [config.screenShare.broadcastOnConnect]);

    return useMemo(
      () => ({
        init: () =>
          state.devices.init({
            audioTrackConstraints: config?.microphone?.trackConstraints,
            videoTrackConstraints: config?.camera?.trackConstraints,
          }),
      }),
      [state.devices],
    );
  };

  const useScreenShare = (): UseScreenShareResult<TrackMetadata> => {
    const { state } = useJellyfishContext();
    return state.devices.screenShare;
  };

  return {
    JellyfishContextProvider,
    useSelector,
    useConnect,
    useDisconnect,
    useStatus,
    useTracks,
    useSetupMedia,
    useCamera,
    useMicrophone,
    useScreenShare,
  };
};
