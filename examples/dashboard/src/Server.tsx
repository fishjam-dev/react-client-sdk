import { ServerRoomSdk } from "./ServerSdk";
import React, { useEffect, useState } from "react";
import { PersistentInput } from "./LogSelector";
import { getBooleanValue } from "../../../src/jellyfish/addLogging";

export const client = new ServerRoomSdk("http://localhost:4000");

const JsonComponent = ({ state }: { state: any }) => (
  <small>
    <pre>
      {JSON.stringify(
        state,
        (key, value) => {
          if (typeof value === "bigint") return value.toString();
          return value;
        },
        2
      )}
    </pre>
  </small>
);

type RoomConfig = {
  maxPeers: number;
};

type RoomType = {
  components: any;
  config: RoomConfig;
  id: string;
  peers: any[];
};

const refetchOnSuccess = "refetch on success";

export const Server = () => {
  const [state, setState] = useState<RoomType[] | null>(null);

  const refetchAll = () => {
    client.get().then((response) => {
      console.log({ name: "createRoom", response });
      setState(response.data.data);
    });
  };

  const refetchIfNeeded = () => {
    if (getBooleanValue(refetchOnSuccess)) {
      refetchAll();
    }
  };

  return (
    <div className="flex flex-row flex-wrap">
      <article className="w-[400px] m-2">
        <PersistentInput name="refetch on success" />
        <div className="flex flex-row justify-start">
          <button
            className="w-[initial]"
            onClick={() => {
              refetchAll();
            }}
          >
            Get all
          </button>
          <button
            className="w-[initial]"
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
        </div>
        <JsonComponent state={state} />
      </article>
      {state?.map((room) => (
        <Room
          key={room.id}
          id={room.id}
          initial={room}
          refetchIfNeeded={refetchIfNeeded}
        ></Room>
      ))}
    </div>
  );
};

type RoomProps = {
  id: string;
  initial: RoomType;
  refetchIfNeeded: () => void;
};

export const Room = ({ id, initial, refetchIfNeeded }: RoomProps) => {
  const [room, setRoom] = useState<RoomType | null>(initial);

  return (
    <article className="">
      <div className="flex flex-row justify-start">
        <button
          className="w-[initial]"
          onClick={() => {
            client.get(id).then((response) => {
              console.log({ name: "refetchRoom", response });
              setRoom(response.data.data);
            });
          }}
        >
          Refetch
        </button>
        <button
          className="w-[initial]"
          onClick={() => {
            client.remove(id).then((response) => {
              console.log({ name: "removeRoom", response });
              refetchIfNeeded()
            });
          }}
        >
          Remove
        </button>
      </div>

      <JsonComponent state={room} />
    </article>
  );
};
