import type { ClientEvents } from "@fishjam-dev/react-client";
import type { PeerMetadata, TrackMetadata } from "../fishjamSetup";
import { useClient } from "../fishjamSetup";
import { useEffect } from "react";

/* eslint-disable no-console */
export const useReconnectLogs = () => {
  const client = useClient();

  useEffect(() => {
    if (!client) return;

    const onReconnectionStarted: ClientEvents<PeerMetadata, TrackMetadata>["reconnectionStarted"] = () => {
      console.log("%c" + "reconnectionStarted", "color:green");
    };

    const onReconnected: ClientEvents<PeerMetadata, TrackMetadata>["reconnected"] = () => {
      console.log("%cReconnected", "color:green");
    };

    const onReconnectionRetriesLimitReached: ClientEvents<
      PeerMetadata,
      TrackMetadata
    >["reconnectionRetriesLimitReached"] = () => {
      console.log("%cReconnectionRetriesLimitReached", "color:red");
    };

    const onSocketError: ClientEvents<PeerMetadata, TrackMetadata>["socketError"] = (error: Event) => {
      console.warn(error);
    };

    const onConnectionError: ClientEvents<PeerMetadata, TrackMetadata>["connectionError"] = (error, client) => {
      if (client.isReconnecting()) {
        console.log("%c" + "During reconnection: connectionError %o", "color:gray", {
          error,
          // @ts-expect-error
          iceConnectionState: error?.event?.target?.["iceConnectionState"],
        });
      } else {
        // @ts-expect-error
        console.warn({ error, state: error?.event?.target?.["iceConnectionState"] });
      }
    };

    const onJoinError: ClientEvents<PeerMetadata, TrackMetadata>["joinError"] = (event) => {
      console.log(event);
    };

    const onAuthError: ClientEvents<PeerMetadata, TrackMetadata>["authError"] = (reason) => {
      if (client.isReconnecting()) {
        console.log("%c" + "During reconnection: authError: " + reason, "color:gray");
      }
    };

    const onSocketClose: ClientEvents<PeerMetadata, TrackMetadata>["socketClose"] = (event) => {
      if (client.isReconnecting()) {
        console.log("%c" + "During reconnection: Signaling socket closed", "color:gray");
      } else {
        console.warn(event);
      }
    };

    client.on("reconnectionStarted", onReconnectionStarted);
    client.on("reconnected", onReconnected);
    client.on("reconnectionRetriesLimitReached", onReconnectionRetriesLimitReached);

    client.on("socketError", onSocketError);
    client.on("connectionError", onConnectionError);
    client.on("joinError", onJoinError);
    client.on("authError", onAuthError);
    client.on("socketClose", onSocketClose);

    return () => {
      client.off("reconnectionStarted", onReconnectionStarted);
      client.off("reconnected", onReconnected);
      client.off("reconnectionRetriesLimitReached", onReconnectionRetriesLimitReached);

      client.off("socketError", onSocketError);
      client.off("connectionError", onConnectionError);
      client.off("joinError", onJoinError);
      client.off("authError", onAuthError);
      client.off("socketClose", onSocketClose);
    };
  }, [client]);
};
