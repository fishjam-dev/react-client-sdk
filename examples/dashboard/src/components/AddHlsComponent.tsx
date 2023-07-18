import React, { FC, useState } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { useLocalStorageStateString } from "./LogSelector";

type Props = {
  roomId: string;
  refetchIfNeeded: () => void;
};

const AddHlsComponent: FC<Props> = ({ roomId, refetchIfNeeded }) => {
  const { componentApi } = useServerSdk();
  const [hlsRtspPort, setHlsRtspPort] = useLocalStorageStateString("rtsp-port", "7777");

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <div className="card-body p-4">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <div className="flex w-full">
              <input
                value={hlsRtspPort || ""}
                onChange={(event) => {
                  setHlsRtspPort(event.target.value);
                }}                className="input input-bordered flex-1"
              />
              <button
                disabled={hlsRtspPort === ""}
                onClick={() => {
                  componentApi
                    ?.jellyfishWebComponentControllerCreate(roomId, {
                      type: "hls",
                      options: { rtpPort: hlsRtspPort },
                    })
                    .then(() => {
                      refetchIfNeeded();
                    });
                }}
                className="btn btn-success ml-1"
              >
                Add HLS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHlsComponent;
