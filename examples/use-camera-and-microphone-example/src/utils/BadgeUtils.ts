import type { PeerStatus } from "@fishjam-dev/react-client";
import type { ReconnectionStatus } from "../../../../../ts-client-sdk";

export const getPeerStatusBadgeColor = (status: PeerStatus): string => {
  switch (status) {
    case "joined":
      return "badge-success";
    case "error":
      return "badge-error";
    case "authenticated":
    case "connected":
      return "badge-info";
    case "connecting":
      return "badge-warning";
  }
  return "";
};

export const getReconnectionStatusBadgeColor = (status: ReconnectionStatus) => {
  switch (status) {
    case "idle":
      return "badge-info";
    case "error":
      return "badge-error";
    case "reconnecting":
      return "badge-warning";
  }
};
