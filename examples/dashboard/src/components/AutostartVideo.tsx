import React, { useEffect, useState } from "react";
import { EnumerateDevices, enumerateDevices, useUserMedia } from "../utils/MediaDeviceUtils";
import VideoPlayer from "./VideoPlayer";
import { useLocalStorageState } from "./LogSelector";
import { JsonComponent } from "./JsonComponent";

type IdToStream = Record<string, MediaStream>;

// todo automayczne wybieranie poprzenio wybranego urządzenia

export const AutostartVideo = () => {
  const [autostartDeviceManager, setAutostartDeviceManager] = useLocalStorageState("AUTOSTART-DEVICE-MANAGER");
  const [enumerateDevicesState, setEnumerateDevicesState] = useState<EnumerateDevices | null>(null);
  const [autostartVideo, setAutostartVideo] = useLocalStorageState("AUTOSTART-VIDEO");
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [show, setShow] = useLocalStorageState("show-autostart-media-device-state");


  useEffect(() => {
    if (!autostartVideo) return;
    setCameraId(selectedCameraId);
  }, [selectedCameraId, autostartVideo]);

  const cameraState = useUserMedia("video", cameraId);

  const enumerateAllDevices = () =>
    enumerateDevices(true, true).then((result) => {
      setEnumerateDevicesState(result);
    });

  useEffect(() => {
    if (!autostartDeviceManager) return;

    enumerateAllDevices();
  }, []);

  return (
    <div className="card card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex flex-row">
          <div className="form-control flex flex-row flex-wrap content-center">
            <label className="label cursor-pointer">
              <input
                className="checkbox"
                type="checkbox"
                checked={autostartDeviceManager}
                onChange={() => {
                  setAutostartDeviceManager(!autostartDeviceManager);
                }}
              />
              <span className="label-text ml-2">Autostart enumeration</span>
            </label>
          </div>
          <button type="button" className="btn btn-info btn-sm m-2" onClick={() => enumerateAllDevices()}>
            Refresh list
          </button>
          <div className="form-control flex flex-row flex-wrap content-center">
            <label className="label cursor-pointer">
              <input
                className="checkbox"
                type="checkbox"
                checked={autostartVideo}
                onChange={() => {
                  setAutostartVideo(!autostartVideo);
                }}
              />
              <span className="label-text ml-2">Autostart video</span>
            </label>
          </div>
          <button
            className="btn btn-sm m-2"
            onClick={() => {
              setShow(!show);
            }}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex flex-row">
          <div className="flex flex-col w-96">
            <h3>Camera</h3>
            <select
              className="select select-bordered w-full max-w-xs m-2"
              onChange={(event) => {
                setCameraId(null);
                setSelectedCameraId(event.target.value);
              }}
              defaultValue="Select camera"
            >
              <option disabled>Select camera</option>
              {enumerateDevicesState?.video.type === "OK" &&
                enumerateDevicesState.video?.devices?.map(({ deviceId, label }) => (
                  <option key={deviceId} value={deviceId}>
                    {label}
                  </option>
                ))}
            </select>
            <div className="flex flex-col">
              <div>{selectedCameraId}</div>
              <div>
                <button
                  type="button"
                  className="btn btn-success btn-sm m-2"
                  disabled={!selectedCameraId || !!cameraState.stream}
                  onClick={() => {
                    if (cameraId) {
                      cameraState.start();
                    } else {
                      setCameraId(selectedCameraId);
                    }
                  }}
                >
                  Start
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-sm m-2"
                  disabled={!cameraState.stream}
                  onClick={() => {
                    cameraState.stop();
                  }}
                >
                  Stop
                </button>
                <div className="loading"></div>
              </div>
              <VideoPlayer stream={cameraState.stream} />
            </div>
          </div>
        </div>
        {show && <JsonComponent state={enumerateDevicesState} />}
      </div>
    </div>
  );
};
