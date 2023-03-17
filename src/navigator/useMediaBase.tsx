import { useCallback, useEffect, useState } from "react";
import { NOOP } from "./utils";
import { MediaType } from "./types";
import { defaultState, stopTracks, UseUserMedia } from "./useUserMedia";

export const useMediaBase = (getMedia: () => Promise<MediaStream>): UseUserMedia => {
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
