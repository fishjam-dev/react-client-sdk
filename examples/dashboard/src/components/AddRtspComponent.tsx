import React, { FC, useState } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { useLocalStorageStateString } from "./LogSelector";

type Props = {
  roomId: string;
  refetchIfNeeded: () => void;
};

const AddRtspComponent: FC<Props> = ({ roomId, refetchIfNeeded }) => {
  const { componentApi } = useServerSdk();
  const [src, setSrc] = useLocalStorageStateString("hls-url", "");
  const [srcInput, setSrcInput] = useState(src || "");

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <div className="card-body p-4">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <div className="flex w-full">
              <input
                value={srcInput}
                onChange={(e) => setSrcInput(e.target.value)}
                className="input input-bordered flex-1"
              />
              <button
                disabled={srcInput === ""}
                onClick={() => {
                  componentApi
                    ?.jellyfishWebComponentControllerCreate(roomId, {
                      type: "rtsp",
                      options: {
                        sourceUri: src,
                      },
                    })
                    .then(() => {
                      refetchIfNeeded();
                    });
                  setSrc(srcInput);
                }}
                className="btn btn-success ml-1"
              >
                Add RTSP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRtspComponent;
