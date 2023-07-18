import React, { ChangeEvent, FC } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { usePersistentRadio } from "./LogSelector";
import { RoomConfigEnforceEncodingEnum } from "../server-sdk";

type Props = {
  refetchIfNeeded: () => void;
};

function isRoomEnforceEncoding(value: string): value is RoomConfigEnforceEncodingEnum {
  return value === RoomConfigEnforceEncodingEnum.Vp8 || value === RoomConfigEnforceEncodingEnum.H264;
}

const CreateRoom: FC<Props> = ({ refetchIfNeeded }) => {
  const { roomApi } = useServerSdk();
  const [enforceEncodingInput, setEnforceEncodingInput] = usePersistentRadio<RoomConfigEnforceEncodingEnum>(
    "enforce-encoding",
    "vp8"
  );

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isRoomEnforceEncoding(event.target.value)) {
      setEnforceEncodingInput(event.target.value);
    }
  };

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <div className="card-body p-4">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <div className="flex w-full">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">h264</span>
                  <input
                    type="radio"
                    name="radio-10"
                    value="h264"
                    className="radio"
                    onChange={onChange}
                    checked={enforceEncodingInput === "h264"}
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">vp8</span>
                  <input
                    type="radio"
                    name="radio-10"
                    value="vp8"
                    className="radio"
                    onChange={onChange}
                    checked={enforceEncodingInput === "vp8"}
                  />
                </label>
              </div>
              {enforceEncodingInput}
              <button
                className="btn btn-sm btn-success m-1"
                onClick={() => {
                  roomApi
                    ?.jellyfishWebRoomControllerCreate({
                      maxPeers: 10,
                      enforceEncoding: enforceEncodingInput,
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
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
