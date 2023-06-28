import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PeerApi, RoomApi } from "../server-sdk";
import axios from "axios";
import { useLocalStorageStateString } from "./LogSelector";

const localStorageServerAddress = "serverAddress";

export type ServerSdkType = {
  setServerAddressInput: (value: string) => void;
  serverAddressInput: string | null;
  signalingWebsocket: string | null;
  serverMessagesWebsocket: string | null;
  roomApi: RoomApi | null;
  peerApi: PeerApi | null;
  serverToken: string | null;
  setServerToken: (value: string | null) => void;
};

const ServerSdkContext = React.createContext<ServerSdkType | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

const prepareHostPort = (input: string) => {
  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url;
    }
    return new URL(`http://${input}`);
  } catch (e) {
    return null;
  }
};

export const ServerSDKProvider = ({ children }: Props) => {
  const [serverAddressInput, setServerAddressState] = useLocalStorageStateString(
    localStorageServerAddress,
    "localhost:5002"
  );

  const [signalingWebsocket, setSignalingWebsocket] = useState<string | null>(null);
  const [serverMessagesWebsocket, setServerMessagesWebsocket] = useState<string | null>(null);
  const [httpApiUrl, setHttpApiUrl] = useState<string | null>(null);

  const [serverToken, setServerToken] = useLocalStorageStateString("serverToken", "development");

  const setServerAddressInput = useCallback(
    (value: string) => {
      setServerAddressState(value);
      localStorage.setItem(localStorageServerAddress, value);
    },
    [setServerAddressState]
  );

  useEffect(() => {
    if (!serverAddressInput) return;
    const url = prepareHostPort(serverAddressInput);

    if (!url) {
      setServerMessagesWebsocket(null);
      setSignalingWebsocket(null);
      setHttpApiUrl(null);
      return;
    }

    const hostPort = url.host + url.pathname;
    const protocol = url?.protocol === "https:" || url?.protocol === "http:" ? url.protocol : null;
    if (!protocol) {
      return;
    }
    const websocketProtocol = protocol === "https:" ? "wss" : "ws";
    setServerMessagesWebsocket(`${websocketProtocol}://${hostPort}socket/server/websocket`);
    setSignalingWebsocket(`${websocketProtocol}://${hostPort}socket/peer/websocket`);
    setHttpApiUrl(`${protocol}//${hostPort}`);
  }, [serverAddressInput]);

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
    () => (httpApiUrl ? new RoomApi(undefined, httpApiUrl || "", client) : null),
    [client, httpApiUrl]
  );
  const peerApi = useMemo(
    () => (httpApiUrl ? new PeerApi(undefined, httpApiUrl || "", client) : null),
    [client, httpApiUrl]
  );

  useEffect(() => {
    console.log({ name: "roomApi", roomApi });
  }, [roomApi]);

  useEffect(() => {
    console.log({ name: "httpApiUrl", httpApiUrl });
  }, [httpApiUrl]);

  useEffect(() => {
    console.log({ name: "serverMessagesWebsocket", serverMessagesWebsocket });
  }, [serverMessagesWebsocket]);
  useEffect(() => {
    console.log({ name: "signalingWebsocket", signalingWebsocket });
  }, [signalingWebsocket]);

  return (
    <ServerSdkContext.Provider
      value={{
        roomApi,
        peerApi,
        serverToken,
        setServerToken,
        serverAddressInput,
        setServerAddressInput,
        serverMessagesWebsocket,
        signalingWebsocket,
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
