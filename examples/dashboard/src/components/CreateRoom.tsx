import React, { ChangeEvent, FC } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type Props = {
  refetchIfNeeded: () => void;
};

type EnforceEncoding = "h264" | "vp8";

const videoCodecAtom = atomWithStorage<EnforceEncoding>("enforce-encoding", "vp8");

const isRoomEnforceEncoding = (value: string): value is EnforceEncoding => value === "h264" || value === "vp8";

const CreateRoom: FC<Props> = ({ refetchIfNeeded }) => {
  const { roomApi } = useServerSdk();
  const [videoCodec, setEnforceEncodingInput] = useAtom(videoCodecAtom);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isRoomEnforceEncoding(event.target.value)) {
      setEnforceEncodingInput(event.target.value);
    }
  };

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <div className="card-body p-4 flex flex-row w-full justify-between">
        <div className="flex flex-row gap-4">
          <div className="form-control">
            <label className="flex flex-row gap-2 label cursor-pointer">
              <span className="label-text">h264</span>
              <input
                type="radio"
                name="radio-10"
                value="h264"
                className="radio"
                onChange={onChange}
                checked={videoCodec === "h264"}
              />
            </label>
          </div>
          <div className="form-control">
            <label className="flex flex-row gap-2 label cursor-pointer">
              <span className="label-text">vp8</span>
              <input
                type="radio"
                name="radio-10"
                value="vp8"
                className="radio"
                onChange={onChange}
                checked={videoCodec === "vp8"}
              />
            </label>
          </div>
        </div>
        <button
          className="btn btn-sm btn-success m-1"
          onClick={() => {
            roomApi
              ?.jellyfishWebRoomControllerCreate({
                maxPeers: 10,
                videoCodec: videoCodec,
              })
              .then(() => {
                refetchIfNeeded();
              });
          }}
        >
          Create room
        </button>
      </div>
    </div>
  );
};

export default CreateRoom;
