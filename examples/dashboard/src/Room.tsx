import React, { useState } from "react";
import { useLocalStorageState } from "./LogSelector";
import { getBooleanValue } from "../../../src/jellyfish/addLogging";
import { Peer } from "@jellyfish-dev/membrane-webrtc-js";
import { client, REFETH_ON_SUCCESS } from "./Server";
import { JsonComponent } from "./JsonComponent";
import { Client } from "./Client";

type RoomConfig = {
  maxPeers: number;
};
export type RoomType = {
  components: any;
  config: RoomConfig;
  id: string;
  peers: any[];
};
type RoomProps = {
  roomId: string;
  initial: RoomType;
  refetchIfNeeded: () => void;
};

const emojiList = ["🐙","🐸","🐶", "🍎", "🍌", "🍒"];

export const Room = ({ roomId, initial, refetchIfNeeded }: RoomProps) => {
  const [room, setRoom] = useState<RoomType | null>(initial);
  const [show, setShow] = useLocalStorageState(`show-json-${roomId}`);

  const refetch = () => {
    client.get(roomId).then((response) => {
      console.log({ name: "refetchRoom", response });
      setRoom(response.data.data);
    });
  };

  const refetchIfNeededInner = () => {
    if (getBooleanValue(REFETH_ON_SUCCESS)) {
      refetchIfNeeded();
      refetch();
    }
  };

  return (
    <div className="h-full">
      <article className="m-2 p-4 w-[500px]">
        <div className="flex flex-row justify-start">
          <button
            className="w-[initial] mx-1 my-0"
            onClick={() => {
              refetch();
            }}
          >
            Refetch
          </button>
          <button
            className="w-[initial] mx-1 my-0"
            onClick={() => {
              client.remove(roomId).then((response) => {
                console.log({ name: "removeRoom", response });
                refetchIfNeededInner();
              });
            }}
          >
            Remove
          </button>
          <button
            className="w-[initial] mx-1 my-0"
            onClick={() => {
              client
                .addPeer(roomId, "webrtc")
                .then((response) => {
                  console.log({ name: "createRoom", response });
                })
                .then(() => {
                  refetchIfNeededInner();
                });
            }}
          >
            Create peer
          </button>
          <button
            className="w-[initial] mx-1 my-0"
            onClick={() => {
              setShow(!show);
            }}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <div className="mt-2">{show && <JsonComponent state={room} />}</div>

        {room?.peers.map(({ id }: Peer, idx: number) => {
          return (
            <Client key={id} roomId={roomId} peerId={id} name={id} emoji={emojiList[idx] ?? "🐛"} />
          );
        })}
      </article>
    </div>
  );
};
