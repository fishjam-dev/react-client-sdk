import { useCallback, useEffect, useState } from "react";
import { getUserMedia } from "./getUserMedia";
import { NOOP } from "./utils";
import { MediaType } from "./types";

export type UseUserMedia = {
  isError: boolean;
  stream: MediaStream | null;
  isLoading: boolean;
  start: () => void;
  stop: () => void;
  isEnabled: boolean;
  disable: () => void;
  enable: () => void;
};

const defaultState: UseUserMedia = {
  isError: false,
  stream: null,
  isLoading: false,
  start: NOOP,
  stop: NOOP,
  isEnabled: true,
  disable: NOOP,
  enable: NOOP,
};

const stopTracks = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};
export const useUserMedia = (
  type: MediaType,
  deviceId: string | null
): UseUserMedia => {
  const [state, setState] = useState<UseUserMedia>(defaultState);

  const setEnable = useCallback(
    (status: boolean) => {
      state.stream?.getTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = status;
      });
      setState(
        (prevState: UseUserMedia): UseUserMedia => ({
          ...prevState,
          isEnabled: status,
        })
      );
    },
    [state.stream, setState]
  );

  const startInner: (
    deviceId: string,
    type: MediaType
  ) => Promise<MediaStream> = useCallback(
    (deviceId: string, type: MediaType) => {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      return getUserMedia(deviceId, type)
        .then((mediasStream) => {
          const stop = () => {
            stopTracks(mediasStream);
            setState((prevState) => ({
              ...prevState,
              stop: NOOP,
              start: () => startInner(deviceId, type),
              stream: null,
              isEnabled: false,
              disable: NOOP,
              enable: NOOP,
            }));
          };

          setState((prevState: UseUserMedia) => {
            return {
              ...prevState,
              isLoading: false,
              stream: mediasStream,
              start: NOOP,
              stop: stop,
              disable: () => setEnable(false),
              enable: () => setEnable(false),
              isEnabled: true,
            };
          });
          return mediasStream;
        })
        .catch((e) => {
          setState((prevState) => ({
            ...prevState,
            isLoading: false,
            isError: true,
            isEnabled: false,
            disable: NOOP,
            enable: NOOP,
          }));
          return Promise.reject(e);
        });
    },
    []
  );

  useEffect(() => {
    if (!deviceId) return;
    const result: Promise<MediaStream> = startInner(deviceId, type);

    return () => {
      result.then((mediaStream) => {
        stopTracks(mediaStream);
        setState((prevState) => ({
          ...prevState,
          stop: NOOP,
          start: () => startInner(deviceId, type),
          stream: null,
        }));
      });
    };
  }, [type, deviceId]);

  return state;
};
