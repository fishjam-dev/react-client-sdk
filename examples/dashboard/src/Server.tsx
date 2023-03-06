import { ServerRoomSdk } from "./ServerSdk";
import React, { useEffect, useState } from "react";
import { PersistentInput, useLocalStorageState } from "./LogSelector";
import { getBooleanValue } from "../../../src/jellyfish/addLogging";
import { Room, RoomType } from "./Room";
import { JsonComponent } from "./JsonComponent";

export const client = new ServerRoomSdk("http://localhost:4000");

export const REFETH_ON_SUCCESS = "refetch on success";

export const Server = () => {
  const [state, setState] = useState<RoomType[] | null>(null);
  const [show, setShow] = useLocalStorageState(`show-json-fullstate`);

  const refetchAll = () => {
    client.get().then((response) => {
      console.log({ name: "createRoom", response });
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
      <div className="flex flex-row justify-start m-1 p-2">
        <PersistentInput name="refetch on success" />
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
      </div>

      <div className="flex flex-row w-full h-full m-1 p-2 items-start">
        {show && (
          <div className="w-[600px] m-1 card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Server state:</h2>
              <JsonComponent state={state} />
            </div>
          </div>
        )}
        {state?.map((room) => (
          <Room
            key={room.id}
            roomId={room.id}
            initial={room}
            refetchIfNeeded={refetchIfNeeded}
          ></Room>
        ))}
      </div>
    </div>
  );
};
