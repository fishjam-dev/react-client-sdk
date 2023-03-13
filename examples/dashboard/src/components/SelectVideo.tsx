import { useState } from "react";
import { EnumerateDevices, enumerateDevices } from "../utils/MediaDeviceUtils";
import VideoPlayer from "./VideoPlayer";

type IdToStream = Record<string, MediaStream>;

export const SelectVideo = () => {
  const [enumerateDevicesState, setEnumerateDevicesState] = useState<EnumerateDevices | null>(null);
  const [microphoneId, setMicrophoneId] = useState<string | null>(null);
  const [buttonCameraId, setButtonCameraId] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [audioStreams, setAudioStreams] = useState<IdToStream | null>(null);
  const [cameraStreams, setCameraStreams] = useState<IdToStream | null>(null);

  return (
    <div className="">
      <div className="flex flex-row">
        <button
          type="button"
          className="btn btn-info btn-sm m-2"
          onClick={() =>
            enumerateDevices(true, true).then((result) => {
              setEnumerateDevicesState(result);
            })
          }
        >
          Refresh list
        </button>
      </div>
      <div className="flex flex-row">
        <div>
          {buttonCameraId}
          {enumerateDevicesState?.video.type === "OK" &&
            enumerateDevicesState.video?.devices?.map(({ deviceId, label }) => (
              <div key={deviceId} className="flex flex-col">
                <div>{label}</div>
                <div>
                  <button
                    type="button"
                    className="btn btn-success btn-sm m-2"
                    onClick={() => {
                      navigator.mediaDevices
                        .getUserMedia({
                          video: {
                            deviceId: deviceId,
                          },
                        })
                        .then((stream) => {
                          setCameraStreams((prev) => {
                            return {
                              ...prev,
                              [deviceId]: stream,
                            };
                          });
                        });
                    }}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-sm m-2"
                    onClick={() => {
                      setCameraStreams((prev) => {
                        setButtonCameraId(null);
                        const mediaStreams = { ...prev };
                        mediaStreams[deviceId].getVideoTracks().forEach((track) => {
                          track.stop();
                        });
                        delete mediaStreams[deviceId];
                        return mediaStreams;
                      });
                    }}
                  >
                    Stop
                  </button>
                </div>

                {cameraStreams && cameraStreams[deviceId] && (
                  <div className="flex flex-col w-80 indicator">
                    {buttonCameraId === deviceId && (
                      <span className="indicator-item badge badge-success badge-lg"></span>
                    )}
                    <VideoPlayer stream={cameraStreams[deviceId]} />
                    <button
                      type="button"
                      className="btn btn-success btn-sm m-2"
                      onClick={() => {
                        setButtonCameraId(deviceId);
                      }}
                    >
                      Select
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
        <div className="flex flex-col w-96">
          <h3>Microphone</h3>
          <select
            className="select select-bordered w-full max-w-xs m-2"
            onChange={(event) => {
              setMicrophoneId(event.target.value);
            }}
          >
            <option disabled selected>
              Select microphone
            </option>
            {enumerateDevicesState?.audio.type === "OK" &&
              enumerateDevicesState.audio?.devices?.map(({ deviceId, label }) => (
                <option key={deviceId}>{label}</option>
              ))}
          </select>
          <div>{microphoneId}</div>
        </div>
        <div className="flex flex-col w-96">
          <h3>Camera</h3>
          <select
            className="select select-bordered w-full max-w-xs m-2"
            onChange={(event) => {
              setCameraId(event.target.value);
            }}
          >
            <option disabled selected>
              Select camera
            </option>
            {enumerateDevicesState?.video.type === "OK" &&
              enumerateDevicesState.video?.devices?.map(({ deviceId, label }) => (
                <option key={deviceId}>{label}</option>
              ))}
          </select>
          <div>{cameraId}</div>
        </div>
      </div>
    </div>
  );
};
