import { useCallback, useEffect, useRef, useState } from "react";

interface UseDisplayMediaConfig {
    constraints: MediaStreamConstraints | null;    
    initOnMount?: boolean
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
}

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

export function useScreencast({constraints, initOnMount = false}: UseDisplayMediaConfig): UseDisplayMedia {
    const [state, setState] = useState<UseDisplayMediaState>(DEFAULT_STATE);
    const skip = useRef(false);
    
    const init: () => Promise<MediaStream | null> = useCallback(async () => {
        if (state.stream !== null || constraints === null) return null;
        const media = await navigator.mediaDevices.getDisplayMedia(constraints)
        setState(prevState => ({
            ...prevState,
            stream: media,
            isEnabled: true
        }));
        return media;
    }, [constraints, state.stream?.id]);
    
    const stop: () => Promise<void> = useCallback(async () => {
        if (state.stream === null) return;
        stopTracks(state.stream);
        setState(prevState => ({
            ...prevState,
            stream: null,
            isEnabled: false
        }));
    }, [state.stream?.id])
    
    const setEnable: (status: boolean) => void = useCallback(async (status) => {
        if (state.stream === null) return;
        for (const track of state.stream.getTracks()) {
            track.enabled = status
        }
        setState(prevState => ({
            ...prevState,
            isEnabled: status
        }));
    }, [state.stream?.id]);
    
    useEffect(() => {
        if (skip.current) return;
        skip.current = true;
        
        if (initOnMount) {
            init();
        }
        
        return function cleanup() {
            if (state.stream) {
                stopTracks(state.stream);
                setState(prevState => ({
                    ...prevState,
                    stream: null
                }))
            }
        }
    }, []);
    
    return {
        data: state,
        init,
        stop,
        setEnable,
    };
}