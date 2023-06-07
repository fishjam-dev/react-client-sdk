import React, { useCallback, useContext, useMemo, useState } from "react";
import { PeerApi, RoomApi } from "../server-sdk";
import axios from "axios";
import { useLocalStorageStateString } from "./LogSelector";

const localStorageServerAddress = "serverAddress";

export type ServerSdkType = {
  setServerAddress: (value: string) => void;
  serverAddress: string;
  peerWebsocket: string;
  serverWebsocket: string;
  roomApi: RoomApi;
  peerApi: PeerApi;
  serverToken: string | null;
  setServerToken: (value: string | null) => void;
};

const ServerSdkContext = React.createContext<ServerSdkType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ServerSDKProvider = ({ children }: Props) => {
  const [serverAddress, setServerAddressState] = useState<string>(() => {
    const serverAddress = localStorage.getItem(localStorageServerAddress);
    return serverAddress ? serverAddress : "localhost:4000";
  });

  const [serverToken, setServerToken] = useLocalStorageStateString("serverToken", "development");

  const setServerAddress = useCallback(
    (value: string) => {
      setServerAddressState(value);
      localStorage.setItem(localStorageServerAddress, value);
    },
    [setServerAddressState]
  );

  const client = useMemo(
    () =>
      axios.create({
        headers: {
          Authorization: `Bearer ${serverToken}`,
        },
      }),
    [serverToken]
  );

  const roomApi = useMemo(() => new RoomApi(undefined, `http://${serverAddress}`, client), [client, serverAddress]);
  const peerApi = useMemo(() => new PeerApi(undefined, `http://${serverAddress}`, client), [client, serverAddress]);

  const peerWebsocket: string = useMemo(() => serverAddress, [serverAddress]);
  const serverWebsocket: string = useMemo(() => `ws://"${peerWebsocket}/socket/server/websocket`, [peerWebsocket]);

  return (
    <ServerSdkContext.Provider
      value={{
        peerWebsocket,
        serverWebsocket,
        serverAddress,
        setServerAddress,
        roomApi,
        peerApi,
        serverToken,
        setServerToken,
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
