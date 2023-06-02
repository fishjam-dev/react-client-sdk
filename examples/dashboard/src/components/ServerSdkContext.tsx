import React, { useCallback, useContext, useMemo, useState } from "react";
import { PeerApi, RoomApi } from "../server-sdk";
import axios from "axios";

const client = axios.create({
  headers: {
    Authorization: "Bearer development",
  },
});

const localStorageServerAddress = "serverAddress";

export type ServerSdkType = {
  setServerAddress: (value: string) => void;
  serverAddress: string;
  peerWebsocket: string;
  serverWebsocket: string;
  roomApi: RoomApi;
  peerApi: PeerApi;
};

const ServerSdkContext = React.createContext<ServerSdkType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ServerSDKProvider = ({ children }: Props) => {
  const [serverAddress, setServerAddressState] = useState<string>(() => {
    const serverAddress = localStorage.getItem(localStorageServerAddress);
    return serverAddress ? serverAddress : "http://localhost:4000";
  });

  const setServerAddress = useCallback(
    (value: string) => {
      setServerAddressState(value);
      localStorage.setItem(localStorageServerAddress, value);
    },
    [setServerAddressState]
  );
  const roomApi = useMemo(() => new RoomApi(undefined, serverAddress, client), [serverAddress]);
  const peerApi = useMemo(() => new PeerApi(undefined, serverAddress, client), [serverAddress]);

  // const peerWebsocket: string = useMemo(
  //   () => serverAddress.replace("http", "ws") + "/socket/peer/websocket",
  //   [serverAddress]
  // );
  const peerWebsocket: string = "ws://localhost:3001/socket/peer/websocket"
  // const serverWebsocket: string = useMemo(
  //   () => peerWebsocket.replace("/socket/peer/websocket", "/socket/server/websocket"),
  //   [peerWebsocket]
  // );
  const serverWebsocket: string = "ws://localhost:3001/socket/server/websocket"

  return (
    <ServerSdkContext.Provider
      value={{
        peerWebsocket,
        serverWebsocket,
        serverAddress,
        setServerAddress,
        roomApi,
        peerApi,
      }}
    >
      {children}
    </ServerSdkContext.Provider>
  );
};

export const useServerSdk = (): ServerSdkType => {
  const context = useContext(ServerSdkContext);
  if (!context) throw new Error("useServerAddress must be used within a DeveloperInfoProvider");
  return context;
};
