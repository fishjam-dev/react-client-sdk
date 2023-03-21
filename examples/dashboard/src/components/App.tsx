import { ServerRoomSdk } from "../utils/ServerSdk";
import React, { useEffect, useState } from "react";
import { LogSelector, PersistentInput, useLocalStorageState } from "./LogSelector";
import { getBooleanValue } from "../../../../src/jellyfish/addLogging";
import { Room, RoomType } from "./Room";
import { JsonComponent } from "./JsonComponent";
import { ThemeSelector } from "./ThemeSelector";
import { DeviceIdToStream, StreamInfo, VideoDeviceSelector } from "./VideoDeviceSelector";
import { AutostartVideo } from "./AutostartVideo";

export const client = new ServerRoomSdk("http://localhost:4000");

export const REFETH_ON_SUCCESS = "refetch on success";

export const App = () => {
  const [state, setState] = useState<RoomType[] | null>(null);
  const [show, setShow] = useLocalStorageState(`show-json-fullstate`);
  const [showLogSelector, setShowLogSelector] = useLocalStorageState("show-log-selector");
  const [showDeviceSelector, setShowDeviceSelector] = useLocalStorageState("show-log-selector");
  const [showCameraTest, setShowCameraTest] = useLocalStorageState("show-camera-test");
  const [selectedVideoStream, setSelectedVideoStream] = useState<StreamInfo | null>(null);
  const [activeVideoStreams, setActiveVideoStreams] = useState<DeviceIdToStream | null>(null);

  const refetchAll = () => {
    client.get().then((response) => {
      setState(response.data.data);
    });
  };

  useEffect(() => {
    refetchAll();
  }, []);

  const refetchIfNeeded = () => {
    if (getBooleanValue(REFETH_ON_SUCCESS)) {
      refetchAll();
    }
  };

  return (
    <div className="flex flex-col w-full h-full ">
      <div className="flex flex-row justify-between m-2">
        <div className="flex flex-row justify-start items-center">
          <button
            className="btn btn-sm btn-info mx-1 my-0"
            onClick={() => {
              refetchAll();
            }}
          >
            Get all
          </button>
          <button
            className="btn btn-sm btn-success mx-1 my-0"
            onClick={() => {
              client
                .create(10)
                .then((response) => {
                  console.log({ name: "createRoom", response });
                })
                .then(() => {
                  refetchIfNeeded();
                });
            }}
          >
            Create room
          </button>
          <button
            className="btn btn-sm mx-1 my-0"
            onClick={() => {
              setShow(!show);
            }}
          >
            {show ? "Hide server state" : "Show server state"}
          </button>
          <button
            className="btn btn-sm mx-1 my-0"
            onClick={() => {
              setShowLogSelector(!showLogSelector);
            }}
          >
            {showLogSelector ? "Hide log selector" : "Show log selector"}
          </button>
          <button
            className="btn btn-sm mx-1 my-0"
            onClick={() => {
              setShowDeviceSelector(!showDeviceSelector);
            }}
          >
            {showLogSelector ? "Hide device selector" : "Show device selector"}
          </button>
          <button
            className="btn btn-sm mx-1 my-0"
            onClick={() => {
              setShowCameraTest(!showCameraTest);
            }}
          >
            {showCameraTest ? "Hide camera test" : "Show camera test"}
          </button>
          <PersistentInput name="refetch on success" />
        </div>
        <div className="flex flex-row justify-start">
          <ThemeSelector />
        </div>
      </div>

      {showDeviceSelector && (
        <VideoDeviceSelector
          activeVideoStreams={activeVideoStreams}
          setActiveVideoStreams={setActiveVideoStreams}
          selectedVideoStream={selectedVideoStream}
          setSelectedVideoStream={setSelectedVideoStream}
        />
      )}

      <div className="flex flex-row w-full h-full m-2 items-start">
        <div>
          {showCameraTest && <AutostartVideo />}
          {showLogSelector && <LogSelector />}
          {show && (
            <div className="w-[600px] m-2 card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Server state:</h2>
                <JsonComponent state={state} />
              </div>
            </div>
          )}
        </div>
        {state?.map((room) => (
          <Room
            key={room.id}
            roomId={room.id}
            initial={room}
            refetchIfNeeded={refetchIfNeeded}
            selectedVideoStream={selectedVideoStream}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
