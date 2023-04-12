import React, { useEffect, useState } from "react";
import { useLocalStorageState } from "./LogSelector";
import type { Peer } from "@jellyfish-dev/membrane-webrtc-js";
import { REFETCH_ON_SUCCESS } from "./App";
import { JsonComponent } from "./JsonComponent";
import { Client } from "./Client";
import type { StreamInfo } from "./VideoDeviceSelector";
import { CloseButton } from "./CloseButton";
import { CopyToClipboardButton } from "./CopyButton";
import { Room as RoomAPI } from "../server-sdk";
import { peerApi, roomApi } from "../utils/ServerSdk";
import { getBooleanValue, loadObject, removeSavedItem, saveObject } from "../addLogging";

type RoomConfig = {
  maxPeers: number;
};
export type RoomType = {
  components: unknown;
  config: RoomConfig;
  id: string;
  peers: Peer[];
};
type RoomProps = {
  roomId: string;
  initial: RoomAPI;
  refetchIfNeeded: () => void;
  selectedVideoStream: StreamInfo | null;
};

export const Room = ({ roomId, initial, refetchIfNeeded, selectedVideoStream }: RoomProps) => {
  const [room, setRoom] = useState<RoomAPI | null>(initial);
  const [show, setShow] = useLocalStorageState(`show-json-${roomId}`);
  const [token, setToken] = useState<Record<string, string>>({});

  const refetch = () => {
    roomApi.jellyfishWebRoomControllerShow(roomId).then((response) => {
      console.log({ name: "refetchRoom", response });
      setRoom(response.data.data);
    });
  };

  const refetchIfNeededInner = () => {
    if (getBooleanValue(REFETCH_ON_SUCCESS)) {
      refetchIfNeeded();
      refetch();
    }
  };

  const LOCAL_STORAGE_KEY = `tokenList-${roomId}`;
  useEffect(() => {
    setToken(loadObject(LOCAL_STORAGE_KEY, {}));
  }, [LOCAL_STORAGE_KEY]);

  return (
    <div className="flex flex-col items-start mr-4">
      <div className="flex flex-col w-full border-opacity-50 m-2">
        <div className="divider p-2">Room: {roomId}</div>
      </div>

      <div className="flex flex-row items-start">
        <div className="w-120 m-2 card bg-base-100 shadow-xl indicator">
          <CloseButton
            onClick={() => {
              roomApi.jellyfishWebRoomControllerDelete(roomId).then((response) => {
                console.log({ name: "removeRoom", response });
                removeSavedItem(LOCAL_STORAGE_KEY);
                refetchIfNeededInner();
              });
            }}
          />
          <div className="card-body">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between">
                <p className="card-title">
                  Room: <span className="text-xs">{roomId}</span> <CopyToClipboardButton text={roomId} />
                </p>
                <div>
                  <button
                    className="btn btn-sm btn-info mx-1 my-0"
                    onClick={() => {
                      refetch();
                    }}
                  >
                    Refetch
                  </button>
                </div>
              </div>
            </div>
            <div className="h-full">
              <div className="flex flex-row justify-start">
                <button
                  className="btn btn-sm btn-success mx-1 my-0"
                  onClick={() => {
                    peerApi
                      .jellyfishWebPeerControllerCreate(roomId, { type: "webrtc" })
                      .then((response) => {
                        console.log({ name: "createPeer", response });
                        setToken((prev) => {
                          // @ts-ignore
                          if (!response.data.data.peer.id) throw Error("response.data.data.id is undefined");
                          if (!response.data.data.token) throw Error("response.data.data.id is undefined");
                          // @ts-ignore
                          const tokenMap = { ...prev, [response.data.data.peer.id]: response.data.data.token };
                          saveObject(LOCAL_STORAGE_KEY, tokenMap);
                          return tokenMap;
                        });
                      })
                      .then(() => {
                        refetchIfNeededInner();
                      });
                  }}
                >
                  Create peer
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

              <div className="mt-2">{show && <JsonComponent state={room} />}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {room?.peers?.map(({ id }) => {
            return (
              <Client
                key={id}
                roomId={roomId}
                peerId={id || ""}
                token={token[id || ""]}
                name={id || ""}
                refetchIfNeeded={refetchIfNeededInner}
                selectedVideoStream={selectedVideoStream}
                remove={() => {
                  if (!id) throw Error("Room ID is undefined");
                  peerApi.jellyfishWebPeerControllerDelete(roomId, id);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
