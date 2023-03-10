import { useState } from "react";
import VideoPlayer from "./VideoPlayer";

export type StreamInfo = {
  stream: MediaStream;
  id: string;
};
export type DeviceIdToStream = Record<string, StreamInfo>;

type Props = {
  allDevices: MediaDeviceInfo[];
  selectedVideoStream: StreamInfo | null;
  setSelectedVideoStream: (cameraId: StreamInfo | null) => void;
  activeVideoStreams: DeviceIdToStream | null;
  setActiveVideoStreams: (
    setter: ((prev: DeviceIdToStream | null) => DeviceIdToStream) | DeviceIdToStream | null
  ) => void;
};

export const VideoDeviceSelector = ({
  allDevices,
  selectedVideoStream,
  setSelectedVideoStream,
  activeVideoStreams,
  setActiveVideoStreams,
}: Props) => {
  return (
    <div className="p-1">
      <div className="flex flex-row">
        <div>
          {allDevices?.map(({ deviceId, label }) => (
            <div key={deviceId} className="flex flex-col">
              <div>{label}</div>
              <div>
                <button
                  type="button"
                  className="btn btn-success btn-sm m-1"
                  onClick={() => {
                    navigator.mediaDevices
                      .getUserMedia({
                        video: {
                          deviceId: deviceId,
                        },
                      })
                      .then((stream) => {
                        setActiveVideoStreams((prev) => {
                          return {
                            ...prev,
                            [deviceId]: {
                              stream,
                              id: deviceId,
                            },
                          };
                        });
                      });
                  }}
                >
                  Start
                </button>
                <button
                  type="button"
                  className="btn btn-error btn-sm m-1"
                  onClick={() => {
                    setActiveVideoStreams((prev) => {
                      setSelectedVideoStream(null);
                      const mediaStreams = { ...prev };
                      mediaStreams[deviceId].stream.getVideoTracks().forEach((track) => {
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

              {activeVideoStreams && activeVideoStreams[deviceId] && (
                <div className="flex flex-col w-80 indicator">
                  {selectedVideoStream?.id === deviceId && (
                    <span className="indicator-item badge badge-success badge-lg"></span>
                  )}
                  <VideoPlayer stream={activeVideoStreams[deviceId].stream} />
                  <button
                    type="button"
                    className="btn btn-success btn-sm m-1"
                    onClick={() => {
                      setSelectedVideoStream(activeVideoStreams[deviceId]);
                    }}
                  >
                    Select
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
