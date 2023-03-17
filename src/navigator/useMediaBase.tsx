import { useCallback, useEffect, useState } from "react";
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

type Config =
  | {
      type: MediaType;
      deviceId: string | null;
    }
  | {
      type: "DisplayMedia";
      constraints: DisplayMediaStreamOptions | null;
    }
  | {
      type: "UserMedia";
      constraints: MediaStreamConstraints | null;
    };

export const useUserMedia = (getMedia: () => Promise<MediaStream>): UseUserMedia => {
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

  const start: (getMedia: () => Promise<MediaStream>) => Promise<MediaStream> = useCallback(
    (getMedia: () => Promise<MediaStream>) => {
      setState((prevState) => ({ ...prevState, isLoading: true }));

      return getMedia()
        .then((mediasStream) => {
          const stop = () => {
            stopTracks(mediasStream);
            setState((prevState) => ({
              ...prevState,
              stop: NOOP,
              start: () => start(getMedia),
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
              enable: () => setEnable(true),
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

  const stop = useCallback((mediaStream: MediaStream) => {
    stopTracks(mediaStream);
    setState((prevState) => ({
      ...prevState,
      stop: NOOP,
      start: () => start(getMedia),
      stream: null,
    }));
  }, [setState, start]);

  return state;
};
