import { DeviceState, Type, UseUserMediaConfig, UseUserMediaState } from "../useUserMedia/types";
import { Dispatch, MutableRefObject, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { DeviceManager, useUserMediaInternal } from "../useUserMedia";
import { SimulcastConfig, TrackBandwidthLimit } from "@jellyfish-dev/ts-client-sdk";
import { UseCameraAndMicrophoneResult, UseSetupMediaConfig, UseSetupMediaResult } from "./types";
import { State } from "../state.types";
import { Action } from "../reducer";
import { useScreenshare } from "./screenshare";
import { createEmptyApi } from "../state";

export const useSetupMedia = <PeerMetadata, TrackMetadata>(
  state: State<PeerMetadata, TrackMetadata>,
  dispatch: Dispatch<Action<PeerMetadata, TrackMetadata>>,
  config: UseSetupMediaConfig<TrackMetadata>,
): UseSetupMediaResult => {
  const userMediaConfig: UseUserMediaConfig = useMemo(
    () => ({
      storage: config.storage,
      startOnMount: config.startOnMount,
      audioTrackConstraints: config.microphone.trackConstraints,
      videoTrackConstraints: config.camera.trackConstraints,
    }),
    [config],
  );

  const deviceManagerRef = useRef(new DeviceManager(userMediaConfig));

  useSyncExternalStore<UseUserMediaState>(
    (subscribe) => {
      const handler = () => {
        subscribe();
      };

      deviceManagerRef.current.on("managerStarted", handler);
      deviceManagerRef.current.on("managerInitialized", handler);

      deviceManagerRef.current.on("deviceReady", handler);
      deviceManagerRef.current.on("devicesReady", handler);
      deviceManagerRef.current.on("deviceStopped", handler);
      deviceManagerRef.current.on("deviceEnabled", handler);
      deviceManagerRef.current.on("deviceDisabled", handler);

      deviceManagerRef.current.on("error", handler);

      return () => {
        deviceManagerRef.current.on("managerStarted", handler);
        deviceManagerRef.current.on("managerInitialized", handler);

        deviceManagerRef.current.on("deviceReady", handler);
        deviceManagerRef.current.on("devicesReady", handler);
        deviceManagerRef.current.on("deviceStopped", handler);
        deviceManagerRef.current.on("deviceEnabled", handler);
        deviceManagerRef.current.on("deviceDisabled", handler);

        deviceManagerRef.current.on("error", handler);
      };
    },
    () => {
      return deviceManagerRef.current.getSnapshot();
    },
  );

  // const result = useUserMediaInternal(state.media, dispatch, userMediaConfig);

  const screenshareResult = useScreenshare(state, dispatch, { trackConstraints: config.screenshare.trackConstraints });

  // const mediaRef = useRef(result);
  const screenshareMediaRef = useRef(screenshareResult);
  const apiRef = useRef(createEmptyApi<PeerMetadata, TrackMetadata>());

  // useEffect(() => {
  //   mediaRef.current = result;
  //   screenshareMediaRef.current = screenshareResult;
  //   apiRef.current = state.connectivity.api;
  // }, [result, screenshareResult, state.connectivity.api]);

  const videoTrackIdRef = useRef<string | null>(null);
  const audioTrackIdRef = useRef<string | null>(null);
  const screenshareTrackIdRef = useRef<string | null>(null);

  const getDeviceState: (type: Type) => DeviceState | null | undefined = useCallback(
    (type) =>
      type === "screenshare" ? screenshareMediaRef.current.data : deviceManagerRef.current.getSnapshot()?.[type],
    [],
  );
  const getTrackIdRef: (type: Type) => MutableRefObject<string | null> = useCallback(
    (type) => (type === "screenshare" ? screenshareTrackIdRef : type === "video" ? videoTrackIdRef : audioTrackIdRef),
    [],
  );

  const addTrack = useCallback(
    async (
      type: Type,
      trackMetadata?: TrackMetadata,
      simulcastConfig?: SimulcastConfig,
      maxBandwidth?: TrackBandwidthLimit,
    ) => {
      if (!apiRef.current) return Promise.reject();

      const trackIdRef = getTrackIdRef(type);
      if (trackIdRef.current) return Promise.reject();

      const deviceState = getDeviceState(type);
      if (!deviceState) return Promise.reject();

      const track = deviceState.media?.track;
      const stream = deviceState.media?.stream;

      if (!track || !stream) return Promise.reject();

      const trackId = await apiRef.current.addTrack(track, stream, trackMetadata, simulcastConfig, maxBandwidth);
      trackIdRef.current = trackId;
      return trackId;
    },
    [getTrackIdRef, getDeviceState],
  );

  // useEffect(() => {
  //   if (state.status !== "joined") {
  //     videoTrackIdRef.current = null;
  //     audioTrackIdRef.current = null;
  //     screenshareTrackIdRef.current = null;
  //   }
  // }, [state.status]);

  const replaceTrack = useCallback(
    (type: Type, newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata): Promise<void> => {
      if (!apiRef.current) return Promise.reject();

      const trackIdRef = getTrackIdRef(type);
      if (!trackIdRef.current) return Promise.resolve();

      const deviceState = getDeviceState(type);
      if (!deviceState || deviceState.status !== "OK") return Promise.reject();

      if (!newTrack || !stream) return Promise.reject();

      return apiRef.current?.replaceTrack(trackIdRef.current, newTrack, stream, newTrackMetadata);
    },
    [getTrackIdRef, getDeviceState],
  );

  useEffect(() => {
    if (state.status !== "joined") return;

    if (config.camera.autoStreaming && deviceManagerRef.current.getSnapshot()?.video.status === "OK") {
      addTrack(
        "video",
        config.camera.defaultTrackMetadata,
        config.camera.defaultSimulcastConfig,
        config.camera.defaultMaxBandwidth,
      );
    }

    if (config.microphone.autoStreaming && deviceManagerRef.current.getSnapshot()?.audio.status === "OK") {
      addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
    }

    if (config.screenshare.autoStreaming && screenshareMediaRef.current.data?.status === "OK") {
      addTrack(
        "screenshare",
        config.screenshare.defaultTrackMetadata,
        undefined,
        config.screenshare.defaultMaxBandwidth,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.status,
    config.camera.autoStreaming,
    config.microphone.autoStreaming,
    config.screenshare.autoStreaming,
    addTrack,
  ]);

  const removeTrack = useCallback(
    async (type: Type) => {
      const trackIdRef = getTrackIdRef(type);
      if (!trackIdRef.current || !apiRef.current) return;
      await apiRef.current.removeTrack(trackIdRef.current);
      trackIdRef.current = null;
    },
    [getTrackIdRef],
  );

  // useEffect(() => {
  //   if (!apiRef.current) return;
  //   const videoTrack = deviceManagerRef.current.getSnapshot()?.video.media?.track;
  //   const videoStream = deviceManagerRef.current.getSnapshot()?.video.media?.stream;
  //
  //   const cameraPreview = config.camera.preview ?? true;
  //   if (!cameraPreview && result.data?.video.status === "OK" && videoStream) {
  //     addTrack(
  //       "video",
  //       config.camera.defaultTrackMetadata,
  //       config.camera.defaultSimulcastConfig,
  //       config.camera.defaultMaxBandwidth,
  //     );
  //   } else if (videoTrackIdRef.current && videoTrack && videoStream) {
  //     // todo track metadata
  //     if (!videoTrackIdRef.current) return;
  //     replaceTrack("video", videoTrack, videoStream, undefined);
  //   } else if (videoTrackIdRef.current && !videoTrack && !videoStream) {
  //     // todo add nullify option
  //     removeTrack("video");
  //   }
  //
  //   const audioTrack = result.data?.audio.media?.track;
  //   const audioStream = result.data?.audio.media?.stream;
  //
  //   const microphonePreview = config.microphone.preview ?? true;
  //
  //   if (!microphonePreview && result.data?.audio.status === "OK" && audioStream) {
  //     addTrack("audio", config.microphone.defaultTrackMetadata, undefined, config.microphone.defaultMaxBandwidth);
  //   } else if (audioTrackIdRef.current && audioTrack && audioStream) {
  //     // todo track metadata
  //     if (!audioTrackIdRef.current) return;
  //     replaceTrack("audio", audioTrack, audioStream, undefined);
  //   } else if (audioTrackIdRef.current && !audioTrack && !audioStream) {
  //     // todo add nullify option
  //     removeTrack("audio");
  //   }
  //
  //   const screenshareTrack = screenshareResult.data?.media?.track;
  //   const screenshareStream = screenshareResult.data?.media?.stream;
  //
  //   const screensharePreview = config.screenshare.preview ?? true;
  //
  //   if (!screensharePreview && screenshareResult.data?.status === "OK" && screenshareStream) {
  //     addTrack(
  //       "screenshare",
  //       config.screenshare.defaultTrackMetadata,
  //       undefined,
  //       config.screenshare.defaultMaxBandwidth,
  //     );
  //   } else if (screenshareTrackIdRef.current && screenshareTrack && screenshareStream) {
  //     // todo track metadata
  //     if (!screenshareTrackIdRef.current) return;
  //     replaceTrack("screenshare", screenshareTrack, screenshareStream, undefined);
  //   } else if (screenshareTrackIdRef.current && !screenshareTrack && !screenshareStream) {
  //     // todo add nullify option
  //     removeTrack("screenshare");
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   result.data?.video?.media?.deviceInfo?.deviceId,
  //   result.data?.audio?.media?.deviceInfo?.deviceId,
  //   screenshareResult.data?.media?.track,
  //   replaceTrack,
  // ]);

  // const video = useMemo(
  //   () => (videoTrackIdRef.current && state.local?.tracks ? state.local?.tracks[videoTrackIdRef.current] : null),
  //   [state],
  // );
  //
  // const audio = useMemo(
  //   () => (!audioTrackIdRef.current || !state.local?.tracks ? null : state.local?.tracks[audioTrackIdRef.current]),
  //   [state],
  // );

  const screenshare = useMemo(
    () =>
      !screenshareTrackIdRef.current || !state.local?.tracks
        ? null
        : state.local?.tracks[screenshareTrackIdRef.current],
    [state],
  );

  useEffect(() => {
    const payload: UseCameraAndMicrophoneResult<TrackMetadata> = {
      init: deviceManagerRef.current.init,
      start: deviceManagerRef.current.start,
      camera: {
        stop: () => {
          deviceManagerRef.current.stop("video");
        },
        setEnable: (value: boolean) => deviceManagerRef.current.setEnable("video", value),
        start: (deviceId?: string) => {
          deviceManagerRef.current.start({ videoDeviceId: deviceId ?? true });
        },
        addTrack: (
          trackMetadata?: TrackMetadata,
          simulcastConfig?: SimulcastConfig,
          maxBandwidth?: TrackBandwidthLimit,
        ) => {
          return addTrack("video", trackMetadata, simulcastConfig, maxBandwidth);
        },
        removeTrack: () => removeTrack("video"),
        replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) =>
          replaceTrack("video", newTrack, stream, newTrackMetadata),
        broadcast: null,
        status: deviceManagerRef.current.getSnapshot()?.video?.status || null,
        stream: deviceManagerRef.current.getSnapshot()?.video.media?.stream || null,
        track: deviceManagerRef.current.getSnapshot()?.video.media?.track || null,
        enabled: deviceManagerRef.current.getSnapshot()?.video.media?.enabled || false,
        deviceInfo: deviceManagerRef.current.getSnapshot()?.video.media?.deviceInfo || null,
        error: deviceManagerRef.current.getSnapshot()?.video?.error || null,
        devices: deviceManagerRef.current.getSnapshot()?.video?.devices || null,
      },
      microphone: {
        stop: () => deviceManagerRef.current.stop("audio"),
        setEnable: (value: boolean) => deviceManagerRef.current.setEnable("audio", value),
        start: (deviceId?: string) => {
          deviceManagerRef.current.start({ audioDeviceId: deviceId ?? true });
        },
        addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) =>
          addTrack("audio", trackMetadata, undefined, maxBandwidth),
        removeTrack: () => removeTrack("audio"),
        replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) =>
          replaceTrack("audio", newTrack, stream, newTrackMetadata),
        broadcast: null,
        status: deviceManagerRef.current.getSnapshot()?.audio?.status || null,
        stream: deviceManagerRef.current.getSnapshot()?.audio.media?.stream || null,
        track: deviceManagerRef.current.getSnapshot()?.audio.media?.track || null,
        enabled: deviceManagerRef.current.getSnapshot()?.audio.media?.enabled || false,
        deviceInfo: deviceManagerRef.current.getSnapshot()?.audio.media?.deviceInfo || null,
        error: deviceManagerRef.current.getSnapshot()?.audio?.error || null,
        devices: deviceManagerRef.current.getSnapshot()?.audio?.devices || null,
      },
      screenshare: {
        stop: () => screenshareResult.stop(),
        setEnable: (value: boolean) => {
          screenshareResult.setEnable(value);
        },
        start: () => screenshareResult.start(),
        addTrack: (trackMetadata?: TrackMetadata, maxBandwidth?: TrackBandwidthLimit) =>
          addTrack("screenshare", trackMetadata, undefined, maxBandwidth),
        removeTrack: () => removeTrack("screenshare"),
        replaceTrack: (newTrack: MediaStreamTrack, stream: MediaStream, newTrackMetadata?: TrackMetadata) =>
          replaceTrack("screenshare", newTrack, stream, newTrackMetadata),
        broadcast: null,
        status: screenshareResult.data?.status || null,
        stream: screenshareResult.data?.media?.stream ?? null,
        track: screenshareResult.data?.media?.track ?? null,
        enabled: screenshareResult.data?.media?.enabled ?? false,
        error: screenshareResult.data?.error || null,
      },
    };

    // dispatch({ type: "setDevices", data: payload });
  }, [screenshareResult, screenshare, addTrack, removeTrack, replaceTrack]);

  return useMemo(
    () => ({
      init: deviceManagerRef.current.init,
    }),
    [],
  );
};
