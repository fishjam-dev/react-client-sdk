import React from "react";

/*
 * enumerateDevices (permissions not granted)
 * chrome:     {deviceId: '',            kind: 'videoinput',   label: '',     groupId: 'something'}
 * firefox:    {deviceId: 'something',   kind: 'videoinput',   label: '',     groupId: 'something'}
 * safari:     {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 * safari IOS: {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 * chrome IOS: {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 */

export const AUDIO_TRACK_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    advanced: [{ autoGainControl: true }, { noiseSuppression: true }, { echoCancellation: true }],
  },
};

export const VIDEO_TRACK_CONSTRAINTS: MediaTrackConstraints = {
  width: {
    max: 1280,
    ideal: 1280,
    min: 640,
  },
  height: {
    max: 720,
    ideal: 720,
    min: 320,
  },
  frameRate: {
    max: 30,
    ideal: 24,
  },
};

export const VIDEO_TRACK_CONSTRAINTS2: MediaTrackConstraints = {
  width: {
    min: 1280,
  },
  height: {
    min: 720,
  },
  frameRate: {
    max: 30,
    ideal: 24,
  },
};

export const VIDEO_STREAM_CONSTRAINTS: MediaStreamConstraints = {
  video: VIDEO_TRACK_CONSTRAINTS,
};

export const isGranted = (mediaDeviceInfo: MediaDeviceInfo) =>
  mediaDeviceInfo.label !== "" && mediaDeviceInfo.deviceId !== "";
export const isNotGranted = (mediaDeviceInfo: MediaDeviceInfo) =>
  mediaDeviceInfo.label === "" || mediaDeviceInfo.deviceId === "";
const isVideo = (it: MediaDeviceInfo) => it.kind === "videoinput";
const isAudio = (it: MediaDeviceInfo) => it.kind === "audioinput";

type DeviceReturnType =
  | { type: "OK"; devices: MediaDeviceInfo[] }
  | { type: "Error"; message: string | null }
  | { type: "Not requested" };

export type EnumerateDevices = {
  audio: DeviceReturnType;
  video: DeviceReturnType;
};

const toMediaTrackConstraints = (constraint?: boolean | MediaTrackConstraints): MediaTrackConstraints | undefined => {
  if (typeof constraint === "boolean") {
    return constraint ? {} : undefined;
  }
  return constraint;
};

export const enumerateDevices = async (
  videoParam: boolean | MediaTrackConstraints,
  audioParam: boolean | MediaTrackConstraints
): Promise<EnumerateDevices> => {
  if (!navigator?.mediaDevices) throw Error("Navigator is available only in secure contexts");

  const objAudio = toMediaTrackConstraints(audioParam);
  const objVideo = toMediaTrackConstraints(videoParam);

  const booleanAudio = !!audioParam;
  const booleanVideo = !!videoParam;

  let mediaDeviceInfos: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();
  console.log({ mediaDeviceInfos });

  const constraints = {
    video: booleanVideo && mediaDeviceInfos.filter(isVideo).some(isNotGranted) && objVideo,
    audio: booleanAudio && mediaDeviceInfos.filter(isAudio).some(isNotGranted) && objAudio,
  };

  let audioError: string | null = null;
  let videoError: string | null = null;

  try {
    if (constraints.audio || constraints.video) {
      console.log("Before!");
      const requestedDevices = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("After!");

      mediaDeviceInfos = await navigator.mediaDevices.enumerateDevices();

      requestedDevices.getTracks().forEach((track) => {
        track.stop();
      });
    }
  } catch (error: any) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
    videoError = booleanVideo ? error.name : null;
    audioError = booleanAudio ? error.name : null;
  }

  return {
    video: prepareReturn(booleanVideo, mediaDeviceInfos.filter(isVideo), videoError),
    audio: prepareReturn(booleanAudio, mediaDeviceInfos.filter(isAudio), audioError),
  };
};

const prepareReturn = (
  isInterested: boolean,
  mediaDeviceInfo: MediaDeviceInfo[],
  permissionError: string | null
): DeviceReturnType => {
  if (!isInterested) return { type: "Not requested" };
  if (permissionError) return { type: "Error", message: permissionError };
  return { type: "OK", devices: mediaDeviceInfo.filter(isGranted) };
};
