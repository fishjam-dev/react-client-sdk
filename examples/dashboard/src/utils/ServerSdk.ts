import axios from "axios";
import { PeerApi, RoomApi } from "../server-sdk";

axios.defaults.headers.common["Authorization"] = `Bearer development`;

const basePath = "http://localhost:4000";

export const roomApi = new RoomApi(undefined, basePath, axios);
export const peerApi = new PeerApi(undefined, basePath, axios);
