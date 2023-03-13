import React, { useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { createStream } from "../utils/createMockStream";
import { JsonComponent } from "./JsonComponent";
import { EnumerateDevices, enumerateDevices } from "../utils/MediaDeviceUtils";
import { useLocalStorageState } from "./LogSelector";

export type StreamInfo = {
  stream: MediaStream;
  id: string;
};
export type DeviceIdToStream = Record<string, StreamInfo>;

type Props = {
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
  <div className="flex flex-col card bg-base-100 shadow-xl m-2 w-60">
    <div className="card-body">
      <div>{label}</div>
      <div className="flex flex-row flex-wrap justify-between">
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
          className="btn btn-error btn-sm m-2"
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
            className="btn btn-success btn-sm m-2"
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
  selectedVideoStream,
  setSelectedVideoStream,
  activeVideoStreams,
  setActiveVideoStreams,
}: Props) => {
  const [enumerateDevicesState, setEnumerateDevicesState] = useState<EnumerateDevices | null>(null);
  const [show, setShow] = useLocalStorageState("show-media-device-state");

  return (
    <>
      <div className="m-2">
        <button
          className="btn btn-sm btn-info mx-1 my-0"
          onClick={() => {
            enumerateDevices({}, {})
              .then((result) => {
                console.log({ "OK: ": result });
                setEnumerateDevicesState(result);
              })
              .catch((error) => {
                console.log("Error caught " + error);
                setEnumerateDevicesState(error);
              });
          }}
        >
          Enumerate all devices
        </button>
        <button
          className="btn btn-sm btn-info mx-1 my-0"
          onClick={() => {
            enumerateDevices({}, false)
              .then((result) => {
                console.log({ "OK: ": result });
                setEnumerateDevicesState(result);
              })
              .catch((error) => {
                console.log("Error caught " + error);
                setEnumerateDevicesState(error);
              });
          }}
        >
          Enumerate video devices
        </button>
        <button
          className="btn btn-sm btn-info mx-1 my-0"
          onClick={() => {
            enumerateDevices(false, {})
              .then((result) => {
                console.log({ "OK: ": result });
                setEnumerateDevicesState(result);
              })
              .catch((error) => {
                console.log("Error caught " + error);
                setEnumerateDevicesState(error);
              });
          }}
        >
          Enumerate audio devices
        </button>
        <button
          className="btn btn-sm mx-1 my-0"
          onClick={() => {
            setShow(!show);
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <div className="flex w-full flex-row m-2">
        {enumerateDevicesState?.video.type === "OK" &&
          enumerateDevicesState.video.devices.map(({ deviceId, label }) => (
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
      {show && <JsonComponent state={enumerateDevicesState} />}
    </>
  );
};
