import React, { useCallback, useEffect, useState } from "react";
import { useLocalStorageState } from "./LogSelector";
import { REFETCH_ON_SUCCESS } from "./App";
import { JsonComponent } from "./JsonComponent";
import { Client } from "./Client";
import type { StreamInfo } from "./VideoDeviceSelector";
import { CloseButton } from "./CloseButton";
import { CopyToClipboardButton } from "./CopyButton";
import { Room as RoomAPI } from "../server-sdk";
import { useServerSdk } from "./ServerSdkContext";
import { getBooleanValue, loadObject, removeSavedItem, saveObject } from "../utils/localStorageUtils";
import AddRtspComponent from "./AddRtspComponent";
import RoomComponents from "./RoomComponents";

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
  const { roomApi, peerApi, componentApi } = useServerSdk();

  const refetch = () => {
    roomApi?.jellyfishWebRoomControllerShow(roomId).then((response) => {
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

  const removeToken = useCallback(
    (peerId: string) => {
      setToken((prev) => {
        const tokenMap = { ...prev };
        delete tokenMap[peerId];
        saveObject(LOCAL_STORAGE_KEY, tokenMap);
        return tokenMap;
      });
    },
    [LOCAL_STORAGE_KEY]
  );

  const addToken = useCallback(
    (peerId: string, token: string) => {
      setToken((prev) => {
        const tokenMap = { ...prev, [peerId]: token };
        saveObject(LOCAL_STORAGE_KEY, tokenMap);
        return tokenMap;
      });
    },
    [LOCAL_STORAGE_KEY]
  );

  return (
    <div className="flex flex-col items-start w-[1200px]">
      <div className="flex flex-col w-full border-opacity-50 m-2 gap-y-2">
        <div className="divider">Room: {roomId}</div>

        <div className="w-full flex flex-row gap-2 items-start">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-start w-full card bg-base-100 shadow-xl indicator">
              <CloseButton
                onClick={() => {
                  roomApi?.jellyfishWebRoomControllerDelete(roomId).then((response) => {
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
                      <button
                        className="btn btn-sm btn-info mx-1 my-0"
                        onClick={() => {
                          refetch();
                        }}
                      >
                        Refetch
                      </button>
                    </p>
                  </div>
                </div>
                <div className="h-full">
                  <div className="flex flex-row justify-start">
                    <button
                      className="btn btn-sm btn-success mx-1 my-0"
                      onClick={() => {
                        peerApi
                          ?.jellyfishWebPeerControllerCreate(roomId, { type: "webrtc" })
                          .then((response) => {
                            addToken(response.data.data.peer.id, response.data.data.token);
                          })
                          .then(() => {
                            refetchIfNeededInner();
                          });
                      }}
                    >
                      Create peer
                    </button>

                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => {
                        componentApi?.jellyfishWebComponentControllerCreate(roomId, { type: "hls" }).then(() => {
                          refetchIfNeededInner();
                        });
                      }}
                    >
                      Create hls
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
            <AddRtspComponent roomId={roomId} refetchIfNeeded={refetchIfNeededInner} />
            <RoomComponents roomId={roomId} components={room?.components} refetchIfNeeded={refetchIfNeededInner} />
          </div>
          <div className="flex flex-col gap-2">
            {room?.peers?.map(({ id }) => {
              if (!id) return null;
              return (
                <Client
                  key={id}
                  roomId={roomId}
                  peerId={id}
                  token={token[id] || null}
                  name={id}
                  refetchIfNeeded={refetchIfNeededInner}
                  selectedVideoStream={selectedVideoStream}
                  remove={() => {
                    peerApi?.jellyfishWebPeerControllerDelete(roomId, id);
                  }}
                  removeToken={() => {
                    removeToken(id);
                  }}
                  setToken={(token: string) => {
                    addToken(id, token);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
