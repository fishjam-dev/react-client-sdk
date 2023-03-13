import React from "react";

/*
 * enumerateDevices (permissions not granted)
 * chrome:     {deviceId: '',            kind: 'videoinput',   label: '',     groupId: 'something'}
 * firefox:    {deviceId: 'something',   kind: 'videoinput',   label: '',     groupId: 'something'}
 * safari:     {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 * safari IOS: {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 * chrome IOS: {deviceId: '',            kind: 'videoinput',   label: '',     groupId: ''}
 */

export const isGranted = (mediaDeviceInfo: MediaDeviceInfo) =>
  mediaDeviceInfo.label !== "" && mediaDeviceInfo.deviceId !== "";
export const isNotGranted = (mediaDeviceInfo: MediaDeviceInfo) =>
  mediaDeviceInfo.label === "" || mediaDeviceInfo.deviceId === "";
const isVideo = (it: MediaDeviceInfo) => it.kind === "videoinput";
const isAudio = (it: MediaDeviceInfo) => it.kind === "audioinput";

type DeviceReturnType =
  | { type: "OK"; devices: MediaDeviceInfo[] }
  | { type: "Permission denied" }
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
  videoParam?: boolean | MediaTrackConstraints,
  audioParam?: boolean | MediaTrackConstraints
): Promise<EnumerateDevices> => {
  if (!navigator?.mediaDevices) throw Error("Navigator is available only in secure contexts");

  const objAudio = toMediaTrackConstraints(audioParam);
  const objVideo = toMediaTrackConstraints(videoParam);

  const booleanAudio = !!audioParam;
  const booleanVideo = !!videoParam;

  let mediaDeviceInfos: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

  const constraints = {
    video: booleanVideo && mediaDeviceInfos.filter(isVideo).some(isNotGranted) && objVideo,
    audio: booleanAudio && mediaDeviceInfos.filter(isAudio).some(isNotGranted) && objAudio,
  };

  let audioError: boolean = false;
  let videoError: boolean = false;

  try {
    if (constraints.audio || constraints.video) {
      const requestedDevices = await navigator.mediaDevices.getUserMedia(constraints);

      mediaDeviceInfos = await navigator.mediaDevices.enumerateDevices();

      requestedDevices.getTracks().forEach((track) => {
        track.stop();
      });
    }
  } catch (error) {
    videoError = booleanVideo;
    audioError = booleanAudio;
  }

  return {
    video: prepareReturn(booleanVideo, mediaDeviceInfos.filter(isVideo), videoError),
    audio: prepareReturn(booleanAudio, mediaDeviceInfos.filter(isAudio), audioError),
  };
};

const prepareReturn = (
  isInterested: boolean,
  mediaDeviceInfo: MediaDeviceInfo[],
  permissionError: boolean
): DeviceReturnType => {
  if (!isInterested) return { type: "Not requested" };
  if (permissionError) return { type: "Permission denied" };
  return { type: "OK", devices: mediaDeviceInfo.filter(isGranted) };
};
