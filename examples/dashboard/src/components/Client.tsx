import React, { useState } from "react";
import { createNoContextMembraneClient } from "../../../../src/externalState";
import { PeerMetadata, TrackMetadata } from "../jellifishClientSetup";
import VideoPlayer from "./VideoPlayer";
import { JsonComponent } from "./JsonComponent";
import { useLocalStorageState } from "./LogSelector";
import { StreamInfo } from "./VideoDeviceSelector";
import { CloseButton } from "./CloseButton";

type ClientProps = {
  roomId: string;
  peerId: string;
  name: string;
  refetchIfNeeded: () => void;
  selectedVideoStream: StreamInfo | null;
  remove: (roomId: string) => void;
};

type Disconnect = null | (() => void);

export const Client = ({ roomId, peerId, name, refetchIfNeeded, selectedVideoStream, remove }: ClientProps) => {
  const [client] = useState(createNoContextMembraneClient<PeerMetadata, TrackMetadata>());
  const connect = client.useConnect();
  const [disconnect, setDisconnect] = useState<Disconnect>(() => null);
  const fullState = client.useSelector((snapshot) => ({
    local: snapshot.local,
    remote: snapshot.remote,
    bandwidthEstimation: snapshot.bandwidthEstimation,
    status: snapshot.status,
  }));
  const api = client.useSelector((snapshot) => snapshot.connectivity.api);
  const [show, setShow] = useLocalStorageState(`show-json-${peerId}`);

  const mockStream = selectedVideoStream;
  const [trackId, setTrackId] = useState<null | string>(null);

  const isThereAnyTrack =
    Object.values(fullState?.remote || {}).flatMap(({ tracks }) => Object.values(tracks)).length > 0;

  return (
    <div className="card w-150 bg-base-100 shadow-xl m-2 indicator">
      <CloseButton
        onClick={() => {
          remove(roomId);
          setTimeout(() => {
            refetchIfNeeded();
          }, 500);
        }}
      />
      <div className="card-body m-2">
        <h1 className="card-title">Client: {peerId}</h1>
        <div className="flex flex-row justify-between">
          <div className="flex flex-row flex-wrap items-start content-start">
            {disconnect ? (
              <button
                className="btn btn-sm btn-error m-2"
                onClick={() => {
                  disconnect();
                  setDisconnect(() => null);
                  setTimeout(() => {
                    refetchIfNeeded();
                  }, 500);
                }}
              >
                Disconnect
              </button>
            ) : (
              <button
                className="btn btn-sm btn-success m-2"
                onClick={() => {
                  const disconnect = connect(roomId, peerId, { name: name }, true, {
                    websocketUrl: "ws://localhost:4005/socket",
                  });
                  setTimeout(() => {
                    refetchIfNeeded();
                  }, 500);
                  setDisconnect(() => disconnect);
                }}
              >
                Connect
              </button>
            )}
            {trackId === null ? (
              <button
                className="btn btn-sm btn-success m-2"
                disabled={fullState.status !== "connected"}
                onClick={() => {
                  const track = mockStream?.stream?.getVideoTracks()?.[0];
                  const stream = mockStream?.stream;
                  if (!stream || !track) return;
                  const trackId = api?.addTrack(track, stream, {
                    type: "camera",
                    active: true,
                  });
                  if (!trackId) throw Error("Adding track error!");

                  setTrackId(trackId);
                }}
              >
                Add track
              </button>
            ) : (
              <button
                disabled={fullState.status !== "connected"}
                className="btn btn-sm btn-error m-2"
                onClick={() => {
                  if (!trackId) return;
                  api?.removeTrack(trackId);
                  setTrackId(null);
                }}
              >
                Remove track
              </button>
            )}
            <button
              className="btn btn-sm m-2"
              onClick={() => {
                setShow(!show);
              }}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {/*<div className="w-40">{mockStream?.stream && <VideoPlayer stream={mockStream?.stream} />}</div>*/}
          {Object.values(fullState.local?.tracks || {}).map(({ trackId, stream }) => (
            <div key={trackId} className="w-40">
              {stream && <VideoPlayer stream={stream} />}
            </div>
          ))}
        </div>
        {show && <JsonComponent state={fullState} />}
        {isThereAnyTrack && (
          <div>
            Remote tracks:
            {Object.values(fullState?.remote || {}).map(({ id, metadata, tracks }) => {
              return (
                <div key={id}>
                  <h4>
                    {id}: {metadata?.name}
                  </h4>
                  <div>
                    {Object.values(tracks || {}).map(({ stream, trackId }) => (
                      <VideoPlayer key={trackId} stream={stream} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
