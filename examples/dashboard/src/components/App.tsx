import { ServerRoomSdk } from "../utils/ServerSdk";
import React, { useEffect, useState } from "react";
import { LogSelector, PersistentInput, useLocalStorageState } from "./LogSelector";
import { getBooleanValue } from "../../../../src/jellyfish/addLogging";
import { Room, RoomType } from "./Room";
import { JsonComponent } from "./JsonComponent";
import { ThemeSelector } from "./ThemeSelector";
import { enumerateDevices } from "../utils/MediaDeviceUtils";
import { DeviceIdToStream, StreamInfo, VideoDeviceSelector } from "./VideoDeviceSelector";

export const client = new ServerRoomSdk("http://localhost:4000");

export const REFETH_ON_SUCCESS = "refetch on success";

export const App = () => {
  const [state, setState] = useState<RoomType[] | null>(null);
  const [show, setShow] = useLocalStorageState(`show-json-fullstate`);
  const [enumerateDevicesState, setEnumerateDevicesState] = useState<any>(null);
  const [showLogSelector, setShowLogSelector] = useLocalStorageState("show-log-selector");
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
      <div className="flex flex-row justify-between m-1 p-2">
        <div className="flex flex-row justify-start items-center">
          <button
            className="btn btn-sm btn-info mx-1 my-0"
            onClick={() => {
              enumerateDevices(true, true)
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
            Enumerate devices ALL
          </button>
          <button
            className="btn btn-sm btn-info mx-1 my-0"
            onClick={() => {
              enumerateDevices(true, false)
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
            Enumerate devices Video
          </button>
          <button
            className="btn btn-sm btn-info mx-1 my-0"
            onClick={() => {
              enumerateDevices(false, true)
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
            Enumerate devices Audio
          </button>
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
          <PersistentInput name="refetch on success" />
        </div>
        <div className="flex flex-row justify-start">
          <ThemeSelector />
        </div>
      </div>

      {enumerateDevicesState?.video.type === "OK" && (
        <VideoDeviceSelector
          allDevices={enumerateDevicesState.video?.devices}
          activeVideoStreams={activeVideoStreams}
          setActiveVideoStreams={setActiveVideoStreams}
          selectedVideoStream={selectedVideoStream}
          setSelectedVideoStream={setSelectedVideoStream}
        />
      )}

      <div className="flex flex-row w-full h-full m-1 p-2 items-start">
        <div>
          {/*<SelectVideo />*/}
          <JsonComponent state={enumerateDevicesState} />
          {showLogSelector && <LogSelector />}
          {show && (
            <div className="w-[600px] m-1 card bg-base-100 shadow-xl">
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
