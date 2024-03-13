import {
  DEFAULT_AUDIO_TRACK_METADATA,
  DEFAULT_VIDEO_TRACK_METADATA,
  EXAMPLE_PEER_METADATA,
  MANUAL_AUDIO_TRACK_METADATA,
  MANUAL_SCREEN_SHARE_TRACK_METADATA,
  MANUAL_VIDEO_TRACK_METADATA,
  useCamera,
  useConnect,
  useDisconnect,
  useMicrophone,
  useScreenShare,
  useSelector,
  useSetupMedia,
  useStatus,
} from "./jellyfishSetup";
import VideoPlayer from "./VideoPlayer";
import { DeviceSelector } from "./DeviceSelector";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { ThreeStateRadio } from "./ThreeStateRadio";
import AudioVisualizer from "./AudioVisualizer";
import { AUDIO_TRACK_CONSTRAINTS, VIDEO_TRACK_CONSTRAINTS } from "@jellyfish-dev/react-client-sdk";
import { Fragment } from "react";
import { Badge } from "./Badge";
import { DeviceControls } from "./DeviceControls";

const tokenAtom = atomWithStorage("token", "");

const broadcastVideoOnConnectAtom = atomWithStorage<boolean | undefined>("broadcastVideoOnConnect", undefined);
const broadcastVideoOnDeviceStartAtom = atomWithStorage<boolean | undefined>("broadcastVideoOnDeviceStart", undefined);

const broadcastAudioOnConnectAtom = atomWithStorage<boolean | undefined>("broadcastAudioOnConnect", undefined);
const broadcastAudioOnDeviceStartAtom = atomWithStorage<boolean | undefined>("broadcastAudioOnDeviceStart", undefined);

const broadcastScreenShareOnConnectAtom = atomWithStorage<boolean | undefined>(
  "broadcastScreenShareOnConnect",
  undefined,
);
const broadcastScreenShareOnDeviceStartAtom = atomWithStorage<boolean | undefined>(
  "broadcastScreenShareOnDeviceStart",
  undefined,
);

const autostartAtom = atomWithStorage<boolean>("autostart", false, undefined, { getOnInit: true });

export const MainControls = () => {
  const [token, setToken] = useAtom(tokenAtom);

  const connect = useConnect();
  const disconnect = useDisconnect();

  // const fullState = useSelector((s) => s);

  // useEffect(() => {
  //   console.log({ fullState });
  // }, [fullState]);

  const local = useSelector((s) => Object.values(s.local?.tracks || {}));

  const [broadcastVideoOnConnect, setBroadcastVideoOnConnect] = useAtom(broadcastVideoOnConnectAtom);
  const [broadcastVideoOnDeviceStart, setBroadcastVideoOnDeviceStart] = useAtom(broadcastVideoOnDeviceStartAtom);

  const [broadcastAudioOnConnect, setBroadcastAudioOnConnect] = useAtom(broadcastAudioOnConnectAtom);
  const [broadcastAudioOnDeviceStart, setBroadcastAudioOnDeviceStart] = useAtom(broadcastAudioOnDeviceStartAtom);

  const [broadcastScreenShareOnConnect, setBroadcastScreenShareOnConnect] = useAtom(broadcastScreenShareOnConnectAtom);
  const [broadcastScreenShareOnDeviceStart, setBroadcastScreenShareOnDeviceStart] = useAtom(
    broadcastScreenShareOnDeviceStartAtom,
  );

  const [autostart, setAutostart] = useAtom(autostartAtom);

  const { init } = useSetupMedia({
    camera: {
      trackConstraints: VIDEO_TRACK_CONSTRAINTS,
      broadcastOnConnect: broadcastVideoOnConnect,
      broadcastOnDeviceStart: broadcastVideoOnDeviceStart,
      defaultTrackMetadata: DEFAULT_VIDEO_TRACK_METADATA,
      defaultSimulcastConfig: {
        enabled: true,
        activeEncodings: ["l", "m", "h"],
        disabledEncodings: [],
      },
    },
    microphone: {
      trackConstraints: AUDIO_TRACK_CONSTRAINTS,
      broadcastOnConnect: broadcastAudioOnConnect,
      broadcastOnDeviceStart: broadcastAudioOnDeviceStart,
      defaultTrackMetadata: DEFAULT_AUDIO_TRACK_METADATA,
    },
    screenShare: {
      broadcastOnConnect: broadcastScreenShareOnConnect,
      broadcastOnDeviceStart: broadcastScreenShareOnDeviceStart,
      trackConstraints: true,
      defaultTrackMetadata: DEFAULT_VIDEO_TRACK_METADATA,
    },
    startOnMount: autostart,
    storage: true,
  });

  const video = useCamera();
  const audio = useMicrophone();
  const screenShare = useScreenShare();
  const status = useStatus();

  return (
    <div className="flex flex-row flex-wrap gap-2 p-2 md:grid md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="input input-bordered w-full"
          value={token}
          onChange={(e) => setToken(() => e?.target?.value)}
          placeholder="token"
        />
        <div className="flex flex-row">
          <div className="form-control">
            <label className="label flex cursor-pointer flex-row gap-2">
              <span className="label-text">Autostart</span>
              <input
                type="checkbox"
                checked={autostart}
                onChange={() => setAutostart(!autostart)}
                className="checkbox"
              />
            </label>
          </div>
        </div>
        <div className="flex w-full flex-col">
          <ThreeStateRadio
            name="Broadcast video on connect (default false)"
            value={broadcastVideoOnConnect}
            set={setBroadcastVideoOnConnect}
            radioClass="radio-primary"
          />

          <ThreeStateRadio
            name="Broadcast video on device start (default false)"
            value={broadcastVideoOnDeviceStart}
            set={setBroadcastVideoOnDeviceStart}
            radioClass="radio-primary"
          />

          <ThreeStateRadio
            name="Broadcast audio on connect (default false)"
            value={broadcastAudioOnConnect}
            set={setBroadcastAudioOnConnect}
            radioClass="radio-secondary"
          />
          <ThreeStateRadio
            name="Broadcast audio on device start (default false)"
            value={broadcastAudioOnDeviceStart}
            set={setBroadcastAudioOnDeviceStart}
            radioClass="radio-secondary"
          />

          <ThreeStateRadio
            name="Broadcast screen share on connect (default false)"
            value={broadcastScreenShareOnConnect}
            set={setBroadcastScreenShareOnConnect}
            radioClass="radio-secondary"
          />
          <ThreeStateRadio
            name="Broadcast screen share on device start (default false)"
            value={broadcastScreenShareOnDeviceStart}
            set={setBroadcastScreenShareOnDeviceStart}
            radioClass="radio-secondary"
          />
        </div>
        <div className="flex w-full flex-row flex-wrap gap-2">
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              init();
            }}
          >
            Start devices
          </button>

          <button
            className="btn btn-success btn-sm"
            disabled={token === "" || status !== null}
            onClick={() => {
              if (!token || token === "") throw Error("Token is empty");
              connect({
                peerMetadata: EXAMPLE_PEER_METADATA,
                token: token,
              });
            }}
          >
            Connect
          </button>

          <button
            className="btn btn-success btn-sm"
            disabled={token === ""}
            onClick={() => {
              if (!token || token === "") throw Error("Token is empty");
              disconnect();

              connect({
                peerMetadata: { name: "John Doe" }, // example metadata
                token: token,
              });
            }}
          >
            Reconnect
          </button>

          <button
            className="btn btn-error btn-sm"
            disabled={status === null}
            onClick={() => {
              disconnect();
            }}
          >
            Disconnect
          </button>

          <Badge status={status} />
        </div>
        <DeviceSelector
          name="Video"
          devices={video?.devices || null}
          setInput={(id) => {
            if (!id) return;
            video.start(id);
          }}
          defaultOptionText="Select video device"
        />

        <DeviceSelector
          name="Audio"
          devices={audio?.devices || null}
          setInput={(id) => {
            if (!id) return;
            audio.start(id);
          }}
          defaultOptionText="Select audio device"
        />

        <div className="grid grid-cols-3 gap-2">
          <DeviceControls device={video} type="video" status={status} metadata={MANUAL_VIDEO_TRACK_METADATA} />
          <DeviceControls device={audio} type="audio" status={status} metadata={MANUAL_AUDIO_TRACK_METADATA} />
          <DeviceControls
            device={screenShare}
            type="screenshare"
            status={status}
            metadata={MANUAL_SCREEN_SHARE_TRACK_METADATA}
          />
        </div>
      </div>
      <div>
        <div className="prose grid grid-rows-2">
          <div>
            <h3>Local:</h3>
            <div className="max-w-[500px]">
              {video?.track?.kind === "video" && <VideoPlayer stream={video?.stream} />}
              {audio?.track?.kind === "audio" && <AudioVisualizer stream={audio?.stream} />}
              {screenShare?.track?.kind === "video" && <VideoPlayer stream={screenShare?.stream} />}
            </div>
          </div>
          <div>
            <h3>Streaming:</h3>
            {local.map(({ trackId, stream, track }) => (
              <Fragment key={trackId}>
                <div className="max-w-[500px]">
                  {track?.kind === "video" && <VideoPlayer key={trackId} stream={stream} />}
                  {track?.kind === "audio" && <AudioVisualizer stream={stream} />}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainControls;
