import React, { useCallback, useEffect, useState } from "react";
import { LogSelector, PersistentInput, useLocalStorageState } from "./LogSelector";
import { Room } from "./Room";
import { JsonComponent } from "./JsonComponent";
import { ThemeSelector } from "./ThemeSelector";
import type { DeviceIdToStream, StreamInfo } from "./VideoDeviceSelector";
import { VideoDeviceSelector } from "./VideoDeviceSelector";
import { Room as RoomAPI } from "../server-sdk";
import { useServerSdk } from "./ServerSdkContext";
import { showToastError } from "./Toasts";
import { getBooleanValue } from "../utils/localStorageUtils";

export const REFETCH_ON_SUCCESS = "refetch on success";
export const REFETCH_ON_MOUNT = "refetch on mount";

export const App = () => {
  const [state, setState] = useState<RoomAPI[] | null>(null);
  const [showServerState, setShow] = useLocalStorageState(`show-json-fullstate`);
  const [showLogSelector, setShowLogSelector] = useLocalStorageState("showServerState-log-selector");
  const [showDeviceSelector, setShowDeviceSelector] = useLocalStorageState("showServerState-log-selector");
  // const [showCameraTest, setShowCameraTest] = useLocalStorageState("showServerState-camera-test");
  const [selectedVideoStream, setSelectedVideoStream] = useState<StreamInfo | null>(null);
  const [activeVideoStreams, setActiveVideoStreams] = useState<DeviceIdToStream | null>(null);
  const { serverAddress, setServerAddress, roomApi } = useServerSdk();
  const refetchAll = useCallback(() => {
    roomApi
      .jellyfishWebRoomControllerIndex()
      .then((response) => {
        setState(response.data.data);
      })
      .catch(() => {
        showToastError("Cannot connect to Jellyfish server");
        setState(null);
      });
  }, [roomApi]);

  useEffect(() => {
    if (getBooleanValue(REFETCH_ON_MOUNT)) {
      refetchAll();
    }
  }, [refetchAll]);

  const refetchIfNeeded = () => {
    if (getBooleanValue(REFETCH_ON_SUCCESS)) {
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
              roomApi
                .jellyfishWebRoomControllerCreate({ maxPeers: 10 })
                .then((_response) => {
                  // console.log({ name: "createRoom", response });
                })
                .then(() => {
                  refetchIfNeeded();
                });
            }}
          >
            Create room
          </button>
          <button
            className={`btn btn-sm mx-1 my-0 ${showLogSelector ? "btn-ghost" : ""}`}
            onClick={() => {
              setShowLogSelector(!showLogSelector);
            }}
          >
            {showLogSelector ? "Hide log selector" : "Show log selector"}
          </button>

          <button
            className={`btn btn-sm mx-1 my-0 ${showDeviceSelector ? "btn-ghost" : ""}`}
            onClick={() => {
              setShowDeviceSelector(!showDeviceSelector);
            }}
          >
            {showDeviceSelector ? "Hide device selector" : "Show device selector"}
          </button>

          <button
            className={`btn btn-sm mx-1 my-0 ${showServerState ? "btn-ghost" : ""}`}
            onClick={() => {
              setShow(!showServerState);
            }}
          >
            {showServerState ? "Hide server state" : "Show server state"}
          </button>
          <div className="form-control mx-1 my-0 flex flex-row items-center">
            <input
              type="text"
              placeholder="Type here"
              className="input input-bordered w-full max-w-xs"
              value={serverAddress}
              onChange={(event) => {
                setServerAddress(event.target.value);
              }}
            />
            <div className="tooltip tooltip-bottom w-[32px] h-full m-2" data-tip="Jellifish server address">
              <svg
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                ></path>
              </svg>
            </div>
          </div>

          {/*<button*/}
          {/*  className="btn btn-sm mx-1 my-0"*/}
          {/*  onClick={() => {*/}
          {/*    setShowCameraTest(!showCameraTest);*/}
          {/*  }}*/}
          {/*>*/}
          {/*  {showCameraTest ? "Hide camera test" : "Show camera test"}*/}
          {/*</button>*/}
          <div className="flex flex-row w-[150px] mx-1 my-0">
            <PersistentInput name={REFETCH_ON_SUCCESS} />
          </div>
          <div className="flex flex-row w-[150px] mx-1 my-0">
            <PersistentInput name={REFETCH_ON_MOUNT} />
          </div>
        </div>
        <div className="flex flex-row justify-start">
          <ThemeSelector />
        </div>
      </div>
      <div className="flex flex-row w-full h-full m-2 items-start">
        {/*{showCameraTest && <CameraTest />}*/}
        {showLogSelector && <LogSelector />}
        {showDeviceSelector && (
          <VideoDeviceSelector
            activeVideoStreams={activeVideoStreams}
            setActiveVideoStreams={setActiveVideoStreams}
            selectedVideoStream={selectedVideoStream}
            setSelectedVideoStream={setSelectedVideoStream}
          />
        )}

        {showServerState && (
          <div>
            <div className="w-[600px] m-2 card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Server state:</h2>
                <JsonComponent state={state} />
              </div>
            </div>
          </div>
        )}
        {state?.map((room) => (
          <Room
            key={room.id}
            roomId={room.id || ""}
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
