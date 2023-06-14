import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PeerApi, RoomApi } from "../server-sdk";
import axios from "axios";
import { useLocalStorageStateString } from "./LogSelector";

const localStorageServerAddress = "serverAddress";

export type ServerSdkType = {
  setServerAddress: (value: string) => void;
  serverAddress: string | null;
  protocol: string | null;
  peerWebsocket: string;
  serverWebsocket: string;
  roomApi: RoomApi;
  peerApi: PeerApi;
  serverToken: string | null;
  websocketProtocol: string;
  setServerToken: (value: string | null) => void;
};

const ServerSdkContext = React.createContext<ServerSdkType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ServerSDKProvider = ({ children }: Props) => {
  const [serverAddress, setServerAddressState] = useLocalStorageStateString("serverAddress", "localhost:4000");
  const [serverToken, setServerToken] = useLocalStorageStateString("serverToken", "development");
  const [protocol, setProtocol] = useLocalStorageStateString("protocol", "http");

  const [websocketProtocol, setWebsocketProtocol] = useState<string>("ws");

  useEffect(() => {
    if (protocol === "https") {
      setWebsocketProtocol("wss");
    } else {
      setWebsocketProtocol("ws");
    }
  }, [protocol]);

  const setServerAddress = useCallback(
    (value: string) => {
      try {
        const url = new URL(value);
        console.log(url);
        const parsedVal = url.host + url.pathname;
        const protocol = url.protocol;
        setProtocol(protocol.replace(":", ""));
        setServerAddressState(parsedVal);
      } catch (e) {
        // if (!(e instanceof TypeError)) throw e;
        setServerAddressState(value);
      }
      localStorage.setItem(localStorageServerAddress, value);
    },
    [setProtocol, setServerAddressState]
  );

  useEffect(() => {
    console.log("serverAddress changed", serverAddress);
    if (!serverAddress) return;
    try {
      const url = new URL(serverAddress);
      const protocol = url.protocol;
      setProtocol(protocol.replace(":", ""));
    } catch (e) {
      if (!(e instanceof TypeError)) throw e;
    }
  }, [serverAddress, setProtocol]);

  const client = useMemo(
    () =>
      axios.create({
        headers: {
          Authorization: `Bearer ${serverToken}`,
        },
      }),
    [serverToken]
  );

  const roomApi = useMemo(
    () => new RoomApi(undefined, `${protocol}://${serverAddress}`, client),
    [client, protocol, serverAddress]
  );
  const peerApi = useMemo(
    () => new PeerApi(undefined, `${protocol}://${serverAddress}`, client),
    [client, protocol, serverAddress]
  );

  const peerWebsocket: string = useMemo(() => serverAddress ?? "", [serverAddress]);
  const serverWebsocket: string = useMemo(
    () => `${websocketProtocol}://${peerWebsocket}/socket/server/websocket`,
    [peerWebsocket, websocketProtocol]
  );

  useEffect(() => {
    console.log("serverAddress", serverAddress);
  }, [serverAddress]);
  useEffect(() => {
    console.log(peerApi);
  }, [peerApi]);
  useEffect(() => {
    console.log("peerWebsocket", peerWebsocket);
  }, [peerWebsocket]);
  useEffect(() => {
    console.log("protocol", protocol);
  }, [protocol]);

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
        protocol,
        setServerToken,
        websocketProtocol,
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
