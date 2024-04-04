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
import { Client, ClientApi, ClientEvents } from "./Client";
import { MediaDeviceType, ScreenShareManagerConfig } from "./ScreenShareManager";

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
      client.on("devicesStarted", callback);
      client.on("devicesReady", callback);
      client.on("error", callback);

      client.on("targetTrackEncodingRequested", callback);

      client.on("localTrackAdded", callback);
      client.on("localTrackRemoved", callback);
      client.on("localTrackReplaced", callback);
      client.on("localTrackBandwidthSet", callback);
      client.on("localTrackEncodingBandwidthSet", callback);
      client.on("localTrackEncodingEnabled", callback);
      client.on("localTrackEncodingDisabled", callback);
      client.on("localEndpointMetadataChanged", callback);
      client.on("localTrackMetadataChanged", callback);

      client.on("disconnectRequested", callback);

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
        client.removeListener("devicesStarted", callback);
        client.removeListener("devicesReady", callback);
        client.removeListener("error", callback);

        client.removeListener("targetTrackEncodingRequested", callback);

        client.removeListener("localTrackAdded", callback);
        client.removeListener("localTrackRemoved", callback);
        client.removeListener("localTrackReplaced", callback);
        client.removeListener("localTrackBandwidthSet", callback);
        client.removeListener("localTrackEncodingBandwidthSet", callback);
        client.removeListener("localTrackEncodingEnabled", callback);
        client.removeListener("localTrackEncodingDisabled", callback);
        client.removeListener("localEndpointMetadataChanged", callback);
        client.removeListener("localTrackMetadataChanged", callback);

        client.removeListener("disconnectRequested", callback);
      };
    }, []);

    const getSnapshot: () => State<PeerMetadata, TrackMetadata> = useCallback(() => {
      return {
        remote: clientRef.current.remote,
        screenShareManager: clientRef.current.screenShareManager,
        media: clientRef.current.media,
        bandwidthEstimation: clientRef.current.bandwidthEstimation,
        tracks: clientRef.current.tracks,
        local: clientRef.current.local,
        status: clientRef.current.status,
        devices: clientRef.current.devices,
        deviceManager: clientRef.current.deviceManager,
        client: clientRef.current,
      };
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
      const broadcastOnCameraStart = async (
        event: { mediaDeviceType: MediaDeviceType },
        client: ClientApi<PeerMetadata, TrackMetadata>,
      ) => {
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "userMedia" &&
          config.camera.broadcastOnDeviceStart
        ) {
          await client.devices.camera.addTrack(
            config.camera.defaultTrackMetadata,
            config.camera.defaultSimulcastConfig,
            config.camera.defaultMaxBandwidth,
          );
        }
      };

      const managerInitialized: ClientEvents<PeerMetadata, TrackMetadata>["managerInitialized"] = async (
        event,
        client,
      ) => {
        if (event.video?.media?.stream) {
          await broadcastOnCameraStart(event, client);
        }
      };

      const devicesReady: ClientEvents<PeerMetadata, TrackMetadata>["devicesReady"] = async (event, client) => {
        if (event.video.restarted && event.video?.media?.stream) {
          await broadcastOnCameraStart(event, client);
        }
      };

      const deviceReady: ClientEvents<PeerMetadata, TrackMetadata>["deviceReady"] = async (event, client) => {
        if (event.trackType === "video") {
          await broadcastOnCameraStart(event, client);
        }
      };

      state.client.on("managerInitialized", managerInitialized);
      state.client.on("devicesReady", devicesReady);
      state.client.on("deviceReady", deviceReady);

      return () => {
        state.client.removeListener("managerInitialized", managerInitialized);
        state.client.removeListener("devicesReady", devicesReady);
        state.client.removeListener("deviceReady", deviceReady);
      };
    }, [config.camera.broadcastOnDeviceStart]);

    useEffect(() => {
      const removeOnCameraStopped: ClientEvents<PeerMetadata, TrackMetadata>["deviceStopped"] = async (
        event,
        client,
      ) => {
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "userMedia" &&
          event.trackType === "video" &&
          client.devices.camera.broadcast?.stream
        ) {
          await client.devices.camera.removeTrack();
        }
      };

      state.client.on("deviceStopped", removeOnCameraStopped);

      return () => {
        state.client.removeListener("deviceStopped", removeOnCameraStopped);
      };
    }, []);

    useEffect(() => {
      const broadcastCameraOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        if (client.devices.camera.stream && config.camera.broadcastOnConnect) {
          await client.devices.camera.addTrack(
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
      const broadcastOnMicrophoneStart = async (
        event: { mediaDeviceType: MediaDeviceType },
        client: ClientApi<PeerMetadata, TrackMetadata>,
      ) => {
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "userMedia" &&
          config.microphone.broadcastOnDeviceStart
        ) {
          await client.devices.microphone.addTrack(
            config.microphone.defaultTrackMetadata,
            config.microphone.defaultMaxBandwidth,
          );
        }
      };

      const managerInitialized: ClientEvents<PeerMetadata, TrackMetadata>["managerInitialized"] = async (
        event,
        client,
      ) => {
        if (event.audio?.media?.stream) {
          await broadcastOnMicrophoneStart(event, client);
        }
      };

      const devicesReady: ClientEvents<PeerMetadata, TrackMetadata>["devicesReady"] = async (event, client) => {
        if (event.audio.restarted && event.audio?.media?.stream) {
          await broadcastOnMicrophoneStart(event, client);
        }
      };

      const deviceReady: ClientEvents<PeerMetadata, TrackMetadata>["deviceReady"] = async (event, client) => {
        if (event.trackType === "audio") {
          await broadcastOnMicrophoneStart(event, client);
        }
      };

      state.client.on("managerInitialized", managerInitialized);
      state.client.on("deviceReady", deviceReady);
      state.client.on("devicesReady", devicesReady);

      return () => {
        state.client.removeListener("managerInitialized", managerInitialized);
        state.client.removeListener("deviceReady", deviceReady);
        state.client.removeListener("devicesReady", devicesReady);
      };
    }, [config.microphone.broadcastOnDeviceStart]);

    useEffect(() => {
      const removeOnMicrophoneStopped: ClientEvents<PeerMetadata, TrackMetadata>["deviceStopped"] = async (
        event,
        client,
      ) => {
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "userMedia" &&
          event.trackType === "audio" &&
          client.devices.microphone.broadcast?.stream
        ) {
          await client.devices.microphone.removeTrack();
        }
      };

      state.client.on("deviceStopped", removeOnMicrophoneStopped);

      return () => {
        state.client.removeListener("deviceStopped", removeOnMicrophoneStopped);
      };
    }, []);

    useEffect(() => {
      const broadcastMicrophoneOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        if (client.devices.microphone.stream && config.microphone.broadcastOnConnect) {
          await client.devices.microphone.addTrack(
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
      const broadcastOnScreenShareStart: ClientEvents<PeerMetadata, TrackMetadata>["deviceReady"] = async (
        event: { mediaDeviceType: MediaDeviceType },
        client,
      ) => {
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "displayMedia" &&
          config.screenShare.broadcastOnDeviceStart
        ) {
          await client.devices.screenShare.addTrack(
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
      const removeOnScreenShareStopped: ClientEvents<PeerMetadata, TrackMetadata>["deviceStopped"] = async (
        event,
        client,
      ) => {
        const screenShareStatus = state.devices.screenShare.broadcast?.stream;
        if (
          client.status === "joined" &&
          event.mediaDeviceType === "displayMedia" &&
          event.trackType === "video" &&
          screenShareStatus
        ) {
          await client.devices.screenShare.removeTrack();
        }
      };

      state.client.on("deviceStopped", removeOnScreenShareStopped);

      return () => {
        state.client.removeListener("deviceStopped", removeOnScreenShareStopped);
      };
    }, []);

    useEffect(() => {
      const broadcastScreenShareOnConnect: ClientEvents<PeerMetadata, TrackMetadata>["joined"] = async (_, client) => {
        if (client.devices.screenShare.stream && config.screenShare.broadcastOnConnect) {
          await client.devices.screenShare.addTrack(
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
