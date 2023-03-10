import { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { useMockStream } from "./UseMockStream";
import { createStream } from "../utils/createMockStream";

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
  // streamInfo: StreamInfo | null;
};

type VideoTileProps = {
  deviceId: string;
  label: string;
  setActiveVideoStreams: (
    setter: ((prev: DeviceIdToStream | null) => DeviceIdToStream) | DeviceIdToStream | null
  ) => void;
  setSelectedVideoStream: (cameraId: StreamInfo | null) => void;
  selected: boolean;
  streamInfo: StreamInfo | null;
};

const VideoTile = ({
  deviceId,
  label,
  setActiveVideoStreams,
  setSelectedVideoStream,
  selected,
  streamInfo,
}: VideoTileProps) => (
  <div className="flex flex-col card bg-base-100 shadow-xl m-1 w-60">
    <div className="card-body">
      <div>{label}</div>
      <div className="flex flex-row flex-wrap justify-between">
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

      {streamInfo && (
        <div className="flex flex-col w-40 indicator">
          {selected && <span className="indicator-item badge badge-success badge-lg"></span>}
          <VideoPlayer stream={streamInfo.stream} />
          <button
            type="button"
            className="btn btn-success btn-sm m-1"
            onClick={() => {
              setSelectedVideoStream(streamInfo);
            }}
          >
            Select
          </button>
        </div>
      )}
    </div>
  </div>
);

const heartStream: StreamInfo = {
  stream: createStream("💜", "black", 24).stream,
  id: "HEART_STREAM",
};
const frogStream: StreamInfo = {
  stream: createStream("🐸", "black", 24).stream,
  id: "FROG_STREAM",
};
const elixirStream: StreamInfo = {
  stream: createStream("🧪", "black", 24).stream,
  id: "ELIXIR_STREAM",
};
const octopusStream: StreamInfo = {
  stream: createStream("🐙", "black", 24).stream,
  id: "OCTOPUS_STREAM",
};

const mockStreams = [octopusStream, elixirStream, frogStream, heartStream];

export const VideoDeviceSelector = ({
  allDevices,
  selectedVideoStream,
  setSelectedVideoStream,
  activeVideoStreams,
  setActiveVideoStreams,
}: Props) => {
  return (
    <div className="flex w-full flex-row m-1 p-1">
      {allDevices?.map(({ deviceId, label }) => (
        <VideoTile
          key={deviceId}
          deviceId={deviceId}
          label={label}
          setActiveVideoStreams={setActiveVideoStreams}
          setSelectedVideoStream={setSelectedVideoStream}
          selected={selectedVideoStream?.id === deviceId}
          streamInfo={(activeVideoStreams && activeVideoStreams[deviceId]) || null}
        />
      ))}
      {mockStreams?.map((stream) => (
        <VideoTile
          key={stream.id}
          deviceId={stream.id}
          label={stream.id}
          setActiveVideoStreams={setActiveVideoStreams}
          setSelectedVideoStream={setSelectedVideoStream}
          selected={selectedVideoStream?.id === stream.id}
          streamInfo={stream}
        />
      ))}
    </div>
  );
};
