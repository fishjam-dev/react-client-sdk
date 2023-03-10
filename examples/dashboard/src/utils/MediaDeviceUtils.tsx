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

export const enumerateDevices = async (video: boolean, audio: boolean): Promise<EnumerateDevices> => {
  if (!navigator?.mediaDevices) throw Error("Navigator is available only in secure contexts");

  let mediaDeviceInfos: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

  const constraints = {
    video: video && mediaDeviceInfos.filter(isVideo).some(isNotGranted),
    audio: audio && mediaDeviceInfos.filter(isAudio).some(isNotGranted),
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
    videoError = constraints.video;
    audioError = constraints.audio;
  }

  return {
    video: prepareReturn(video, mediaDeviceInfos.filter(isVideo), videoError),
    audio: prepareReturn(audio, mediaDeviceInfos.filter(isAudio), audioError),
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
