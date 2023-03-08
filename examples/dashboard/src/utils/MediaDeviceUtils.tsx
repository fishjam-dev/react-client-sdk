import React from "react";

/*
 * Plan działania:
 * - pobrać wszystkie urządzenia spełniające warunki
 * - z tych urządzeń wybrać domyslne i pobrać z niego ID
 * - poprosić o to urządzenie i wyciągnąć z niego stream
 */

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

type DeviceReturnType =
  | "Permission denied"
  | MediaDeviceInfo[]
  | "Not requested";

export type EnumerateDevices = {
  audio: DeviceReturnType;
  video: DeviceReturnType;
};

export const enumerateDevices = async (
  video: boolean,
  audio: boolean
): Promise<EnumerateDevices> => {
  if (!navigator?.mediaDevices)
    throw Error("Navigator is available only in secure contexts");

  const mediaDeviceInfos: MediaDeviceInfo[] =
    await navigator.mediaDevices.enumerateDevices();

  let videoDevices = mediaDeviceInfos.filter((it) => it.kind === "videoinput");
  let audioDevices = mediaDeviceInfos.filter((it) => it.kind === "audioinput");

  const videoNotGranted = videoDevices.some(isNotGranted);
  const audioNotGranted = audioDevices.some(isNotGranted);

  const constraints = {
    video: video && videoNotGranted,
    audio: audio && audioNotGranted,
  };

  let videosToReturn: DeviceReturnType = videoDevices;
  let audiosToReturn: DeviceReturnType = audioDevices;

  let audioError: boolean = false;
  let videoError: boolean = false;

  try {
    if (constraints.audio || constraints.video) {
      console.log("%cPermissions not granted. Asking...", "color: orange");

      const requestedDevices = await navigator.mediaDevices
        .getUserMedia(constraints)
        .then((result) => {
          console.log(result);
          return result;
        })
        .catch((error) => {
          console.log(error);
          return Promise.reject(error);
        });

      const mediaDeviceInfos = await navigator.mediaDevices.enumerateDevices();

      videosToReturn = mediaDeviceInfos.filter(
        (it) => it.kind === "videoinput"
      );
      audiosToReturn = mediaDeviceInfos.filter(
        (it) => it.kind === "audioinput"
      );

      requestedDevices.getTracks().forEach((track) => {
        track.stop();
      });
    }
  } catch (error) {
    console.log("Error caught in function" + error);

    videoError = constraints.video;
    audioError = constraints.audio;
  }

  return {
    video: prepareReturn(video, videosToReturn, videoError),
    audio: prepareReturn(audio, audiosToReturn, audioError),
  };
};

const prepareReturn = (
  isInterested: boolean,
  mediaDeviceInfo: MediaDeviceInfo[],
  permissionError: boolean
): DeviceReturnType => {
  if (!isInterested) return "Not requested";
  if (permissionError) return "Permission denied";
  return mediaDeviceInfo.filter(isGranted);
};
