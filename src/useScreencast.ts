import { useCallback, useEffect, useRef, useState } from "react";

interface UseDisplayMediaConfig {
  constraints: MediaStreamConstraints | null;
  initOnMount?: boolean;
}

interface UseDisplayMediaState {
  stream: MediaStream | null;
  isEnabled: boolean;
}

interface UseDisplayMedia {
  data: UseDisplayMediaState;
  init: () => Promise<MediaStream | null>;
  stop: () => void;
  setEnable: (status: boolean) => void;
}

const DEFAULT_STATE = {
  stream: null,
  isEnabled: false,
};

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export const SCREENSHARING_MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    frameRate: { ideal: 20, max: 25 },
    width: { max: 1920, ideal: 1920 },
    height: { max: 1080, ideal: 1080 },
  },
};

export function useScreencast({ constraints, initOnMount = false }: UseDisplayMediaConfig): UseDisplayMedia {
  const [state, setState] = useState<UseDisplayMediaState>(DEFAULT_STATE);
  const mediaRef = useRef<MediaStream>();
  const skip = useRef(false);

  const init: () => Promise<MediaStream | null> = useCallback(async () => {
    if (state.stream !== null || constraints === null) return null;
    const media = await navigator.mediaDevices.getDisplayMedia(constraints);
    mediaRef.current = media;
    setState((prevState) => ({
      ...prevState,
      stream: media,
      isEnabled: true,
    }));
    return media;
  }, [constraints, state.stream]);

  const stop: () => Promise<void> = useCallback(async () => {
    if (state.stream === null) return;
    stopTracks(state.stream);
    mediaRef.current = undefined;
    setState((prevState) => ({
      ...prevState,
      stream: null,
      isEnabled: false,
    }));
  }, [state.stream]);

  const setEnable: (status: boolean) => void = useCallback(
    async (status) => {
      if (state.stream === null) return;
      for (const track of state.stream.getTracks()) {
        track.enabled = status;
      }
      setState((prevState) => ({
        ...prevState,
        isEnabled: status,
      }));
    },
    [state.stream]
  );

  useEffect(() => {
    if (!skip.current && initOnMount) {
      init();
    }
    skip.current = true;

    return function cleanup() {
      if (!mediaRef.current) return;
      const media = mediaRef.current;
      stopTracks(media);
      mediaRef.current = undefined;
      setState((prevState) => ({
        ...prevState,
        stream: null,
        isEnabled: false,
      }));
    };
    // We are not including the init and initOnMount inside our dependency array.
    // If the initOnMount was set to true, and React's StrictMode was enabled,
    // then the cleanup function would always run at least once, destorying the MediaStream created by init() call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: state,
    init,
    stop,
    setEnable,
  };
}
