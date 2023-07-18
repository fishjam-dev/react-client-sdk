import React, { FC, useMemo, useState } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { useLocalStorageStateString } from "./LogSelector";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { parseString } from "typedoc/dist/lib/converter/comments/declarationReference";

type Props = {
  roomId: string;
  refetchIfNeeded: () => void;
};

const urlAtom = atomWithStorage("rtsp-url", "");
const portAtom = atomWithStorage("rtsp-port", "7000");
const portAutoIncrementAtom = atomWithStorage("rtsp-port-auto-increment", true);

const isNumeric = (str: string) => !isNaN(parseInt(str));

const AddRtspComponent: FC<Props> = ({ roomId, refetchIfNeeded }) => {
  const { componentApi } = useServerSdk();
  const [url, setUrl] = useAtom(urlAtom);
  const [port, setPort] = useAtom(portAtom);
  const parsedPort = isNumeric(port);
  const [autoIncrement, setAutoIncrement] = useAtom(portAutoIncrementAtom);

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <div className="card-body p-4">
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input input-bordered w-full"
              placeholder="URL"
            />
            <div className="flex w-full gap-2">
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="input input-bordered flex-1"
                placeholder="Port"
              />
              <div className="flex flex-col justify-center tooltip" data-tip="Auto increment">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={autoIncrement}
                  onChange={() => setAutoIncrement((prev) => !prev)}
                />
              </div>
              <button
                disabled={url === "" || !parsedPort}
                onClick={() => {
                  componentApi
                    ?.jellyfishWebComponentControllerCreate(roomId, {
                      type: "rtsp",
                      options: {
                        rtpPort: "",
                        sourceUri: url,
                      },
                    })
                    .then(() => {
                      refetchIfNeeded();
                    });
                  if (autoIncrement) {
                    const newPort = parseInt(port);
                    setPort((newPort + 1).toString());
                  }
                }}
                className="btn btn-success"
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
