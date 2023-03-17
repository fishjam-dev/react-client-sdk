import { useCallback, useEffect, useState } from "react";
import { NOOP } from "./utils";
import { MediaType } from "./types";
import { defaultState, stopTracks, UseUserMedia } from "./useUserMedia";

export const useMediaGeneric = (getMedia: (() => Promise<MediaStream>) | null): UseUserMedia => {
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
      console.log("%cstarting stream", "color: blue")

      setState((prevState) => ({ ...prevState, isLoading: true }));

      return getMedia()
        .then((mediasStream) => {
          const stop = () => {
            console.log("%cManual stopping stream", "color: red")

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

  useEffect(() => {
    console.log("%cuseMediaGeneric invoked", "color: orange")
    if (!getMedia) return;
    const result: Promise<MediaStream> = start(getMedia);

    return () => {
      result.then((mediaStream) => {
        console.log("%cAuto stopping stream", "color: red")

        stopTracks(mediaStream);
        setState((prevState) => ({
          ...prevState,
          stop: NOOP,
          start: () => start(getMedia),
          stream: null,
        }));
      });
    };
  }, [getMedia]);

  return state;
};
