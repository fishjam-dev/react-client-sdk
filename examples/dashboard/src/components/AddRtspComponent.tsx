import { FC, useState } from "react";
import { useServerSdk } from "./ServerSdkContext";

type Props = {
  roomId: string;
  refetchIfNeeded: () => void;
};

const AddRtspComponent: FC<Props> = ({ roomId, refetchIfNeeded }) => {
  const { componentApi } = useServerSdk();
  const [src, setSrc] = useState("");
  const [srcInput, setSrcInput] = useState(src);

  return (
    <div className="w-full">
      <div className="flex mt-2 w-full">
        <input value={srcInput} onChange={(e) => setSrcInput(e.target.value)} className="input input-bordered flex-1" />
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
  );
};

export default AddRtspComponent;
