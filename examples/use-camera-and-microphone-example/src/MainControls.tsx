import {
  DEFAULT_AUDIO_TRACK_METADATA,
  DEFAULT_VIDEO_TRACK_METADATA,
  EXAMPLE_PEER_METADATA,
  MANUAL_AUDIO_TRACK_METADATA,
  MANUAL_SCREEN_SHARE_TRACK_METADATA,
  MANUAL_VIDEO_TRACK_METADATA,
  useAuthErrorReason,
  useCamera,
  useClient,
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
import { Fragment, useState } from "react";
import { Badge } from "./Badge";
import { DeviceControls } from "./DeviceControls";
import { Radio } from "./Radio";

type RestartChange = "stop" | "replace" | undefined;

const isRestartChange = (e: string | undefined): e is RestartChange => {
  return e === undefined || e === "stop" || e === "replace";
};

const tokenAtom = atomWithStorage("token", "");

const broadcastVideoOnConnectAtom = atomWithStorage<boolean | undefined>("broadcastVideoOnConnect", undefined);
const broadcastVideoOnDeviceStartAtom = atomWithStorage<boolean | undefined>("broadcastVideoOnDeviceStart", undefined);
const broadcastVideoOnDeviceChangeAtom = atomWithStorage<RestartChange>(
  "broadcastVideoOnDeviceChange",
  undefined,
);

const broadcastAudioOnConnectAtom = atomWithStorage<boolean | undefined>("broadcastAudioOnConnect", undefined);
const broadcastAudioOnDeviceStartAtom = atomWithStorage<boolean | undefined>("broadcastAudioOnDeviceStart", undefined);
const broadcastAudioOnDeviceChangeAtom = atomWithStorage<RestartChange>("broadcastAudioOnDeviceChange", undefined);

const broadcastScreenShareOnConnectAtom = atomWithStorage<boolean | undefined>(
  "broadcastScreenShareOnConnect",
  undefined,
);
const broadcastScreenShareOnDeviceStartAtom = atomWithStorage<boolean | undefined>(
  "broadcastScreenShareOnDeviceStart",
  undefined,
);
const broadcastScreenShareOnDeviceChangeAtom = atomWithStorage<RestartChange>(
  "broadcastScreenShareOnDeviceChange",
  undefined,
);

const autostartAtom = atomWithStorage<boolean>("autostart", false, undefined, { getOnInit: true });

const secondMediaStream = new MediaStream();

export const MainControls = () => {
  const [token, setToken] = useAtom(tokenAtom);

  const connect = useConnect();
  const disconnect = useDisconnect();

  const local = useSelector((s) => Object.values(s.local?.tracks || {}));
  const client = useClient();

  const [showStreaming, setShowStreaming] = useState<boolean>(true);
  const [originalStream, setOriginalStream] = useState<MediaStream | null>(null);

  const authError = useAuthErrorReason();

  const [broadcastVideoOnConnect, setBroadcastVideoOnConnect] = useAtom(broadcastVideoOnConnectAtom);
  const [broadcastVideoOnDeviceStart, setBroadcastVideoOnDeviceStart] = useAtom(broadcastVideoOnDeviceStartAtom);
  const [broadcastVideoOnDeviceChange, setBroadcastVideoOnDeviceChange] = useAtom(broadcastVideoOnDeviceChangeAtom);

  const [broadcastAudioOnConnect, setBroadcastAudioOnConnect] = useAtom(broadcastAudioOnConnectAtom);
  const [broadcastAudioOnDeviceStart, setBroadcastAudioOnDeviceStart] = useAtom(broadcastAudioOnDeviceStartAtom);
  const [broadcastAudioOnDeviceChange, setBroadcastAudioOnDeviceChange] = useAtom(broadcastAudioOnDeviceChangeAtom);

  const [broadcastScreenShareOnConnect, setBroadcastScreenShareOnConnect] = useAtom(broadcastScreenShareOnConnectAtom);
  const [broadcastScreenShareOnDeviceStart, setBroadcastScreenShareOnDeviceStart] = useAtom(
    broadcastScreenShareOnDeviceStartAtom,
  );
  const [broadcastScreenShareOnDeviceChange, setBroadcastScreenShareOnDeviceChange] = useAtom(
    broadcastScreenShareOnDeviceChangeAtom,
  );

  const [autostart, setAutostart] = useAtom(autostartAtom);

  const { init } = useSetupMedia({
    camera: {
      trackConstraints: VIDEO_TRACK_CONSTRAINTS,
      broadcastOnConnect: broadcastVideoOnConnect,
      broadcastOnDeviceStart: broadcastVideoOnDeviceStart,
      broadcastOnDeviceChange: broadcastVideoOnDeviceChange,
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
      streamConfig: {
        videoTrackConstraints: true,
        // todo handle audio on gui and inside client
        audioTrackConstraints: true,
      },
      defaultTrackMetadata: DEFAULT_VIDEO_TRACK_METADATA,
    },
    startOnMount: autostart,
    storage: true,
  });

  const video = useCamera();
  const audio = useMicrophone();
  const screenShare = useScreenShare();
  const status = useStatus();

  const laptopCameraId = "8591a9c5854b07ed08454cdad900509729b2d04916ad063e49f2f77734370e91";
  const phoneCameraId = "a5c454626afda7f92f092de457cc06937b782e6b4db4bd58dfbe70593b8952bf";

  return (
    <div className="flex flex-row flex-wrap gap-2 p-2 md:grid md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              console.log({ client });
            }}
          >
            Client
          </button>

          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              const trackFromClient = Object.values(client?.local?.tracks ?? {})[0];
              const trackFromStream = trackFromClient.stream?.getVideoTracks()[0];

              console.log("Broadcast");
              console.log({
                track: trackFromClient.track,
                stream: trackFromClient.stream?.id,
                trackFromStream: trackFromStream?.id,
                tracksInStream: trackFromClient.stream?.getVideoTracks().length,
              });
              console.log("");

              console.log("Local device");
              const localTrackFromStream = video.stream?.getVideoTracks()[0];
              console.log({
                track: video.track,
                stream: video.stream?.id,
                trackFromStream: localTrackFromStream?.id,
                tracksInStream: video.stream?.getVideoTracks().length,
              });
              console.log("");
            }}
          >
            List local track and stream
          </button>

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    const mediaDeviceInfos = await navigator.mediaDevices.enumerateDevices();*/}

          {/*    mediaDeviceInfos*/}
          {/*      .filter((dev) => dev.kind === "videoinput")*/}
          {/*      .forEach((device) => {*/}
          {/*        console.log({ device });*/}
          {/*      });*/}
          {/*  }}*/}
          {/*>*/}
          {/*  List devices*/}
          {/*</button>*/}

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    const stream = await navigator.mediaDevices.getUserMedia({*/}
          {/*      video: { deviceId: laptopCameraId },*/}
          {/*    });*/}
          {/*    setOriginalStream(stream);*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Start laptop camera*/}
          {/*</button>*/}

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    const stream = await navigator.mediaDevices.getUserMedia({*/}
          {/*      video: { deviceId: phoneCameraId },*/}
          {/*    });*/}
          {/*    setOriginalStream(stream);*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Start phone camera*/}
          {/*</button>*/}

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    if (!originalStream) throw Error("originalStream is null");*/}
          {/*    console.log({ name: "Before add track", count: secondMediaStream.getVideoTracks().length });*/}
          {/*    secondMediaStream.addTrack(originalStream.getVideoTracks()[0]);*/}
          {/*    console.log({ name: "After add track", count: secondMediaStream.getVideoTracks().length });*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Add track to media stream*/}
          {/*</button>*/}

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    if (!originalStream) throw Error("originalStream is null");*/}
          {/*    originalStream.getVideoTracks().forEach((track) => {*/}
          {/*      track.stop();*/}
          {/*    });*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Stop track*/}
          {/*</button>*/}

          {/*<button*/}
          {/*  className="btn btn-info btn-sm"*/}
          {/*  onClick={async () => {*/}
          {/*    if (!originalStream) throw Error("originalStream is null");*/}

          {/*    const track = originalStream.getVideoTracks()[0];*/}

          {/*    console.log({ name: "Before remove track", count: secondMediaStream.getVideoTracks().length });*/}
          {/*    secondMediaStream.removeTrack(track);*/}
          {/*    console.log({ name: "After remove track", count: secondMediaStream.getVideoTracks().length });*/}
          {/*  }}*/}
          {/*>*/}
          {/*  Remove track from stream*/}
          {/*</button>*/}

          <button
            className="btn btn-info btn-sm"
            onClick={async () => {
              const trackFromClient = Object.values(client?.local?.tracks ?? {})[0];

              if (trackFromClient.stream) {
                const prevTracks = trackFromClient.stream.getVideoTracks();

                console.log({ name: "Active tracks", count: prevTracks.length });
                prevTracks.forEach((track) => {
                  console.log({ name: "Removing track", track });
                  trackFromClient.stream?.removeTrack(track);
                });

                const trackToAdd = client?.media?.video?.media?.track ?? null;

                console.log({ name: "Adding track", trackToAdd });

                if (trackToAdd) {
                  trackFromClient.stream.addTrack(trackToAdd);
                }
              }

              console.log({ stream: trackFromClient.stream });
            }}
          >
            Replace media stream
          </button>
        </div>

        <input
          type="text"
          className="input input-bordered w-full"
          value={token}
          onChange={(e) => setToken(() => e?.target?.value)}
          placeholder="token"
        />
        <div className="flex w-full flex-row flex-wrap items-center gap-2">
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

          <button
            className="btn btn-info btn-sm"
            disabled={client.deviceManager.getStatus() !== "uninitialized"}
            onClick={() => {
              init();
            }}
          >
            Init device manager
          </button>

          <button
            className="btn btn-success btn-sm"
            disabled={token === "" || status === "authenticated" || status === "connected" || status === "joined"}
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
            disabled={token === "" || status === "authenticated" || status === "connected" || status === "joined"}
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
            disabled={status === null || status === "closed" || status === "error"}
            onClick={() => {
              disconnect();
            }}
          >
            Disconnect
          </button>
        </div>

        <div className="flex w-full flex-row flex-wrap items-center gap-2">
          <Badge status={status} />

          {authError && (
            <div className="flex items-center gap-1">
              <span>Auth error:</span>
              <span className={`badge badge-error`}>{authError}</span>
            </div>
          )}
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

          <Radio
            name='Broadcast video on device change (default "replace")'
            value={broadcastVideoOnDeviceChange}
            set={(value) => {
              if (isRestartChange(value)) setBroadcastVideoOnDeviceChange(value);
            }}
            radioClass="radio-primary"
            options={[
              { value: undefined, key: "undefined" },
              { value: "stop", key: "stop" },
              { value: "replace", key: "replace" },
            ]}
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

          <Radio
            name='Broadcast audio on device change (default "replace")'
            value={broadcastAudioOnDeviceChange}
            set={(value) => {
              if (isRestartChange(value)) setBroadcastAudioOnDeviceChange(value);
            }}
            radioClass="radio-primary"
            options={[
              { value: undefined, key: "undefined" },
              { value: "stop", key: "stop" },
              { value: "replace", key: "replace" },
            ]}
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

          <Radio
            name='Broadcast screen share on device change (default "replace")'
            value={broadcastScreenShareOnDeviceChange}
            set={(value) => {
              if (isRestartChange(value)) setBroadcastScreenShareOnDeviceChange(value);
            }}
            radioClass="radio-primary"
            options={[
              { value: undefined, key: "undefined" },
              { value: "stop", key: "stop" },
              { value: "replace", key: "replace" },
            ]}
          />
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
          {/*<div className="flex flex-col">*/}
          {/*  Original stream*/}
          {/*  {originalStream && <VideoPlayer stream={originalStream} />}*/}
          {/*  secondMediaStream stream*/}
          {/*  {secondMediaStream && <VideoPlayer stream={secondMediaStream} />}*/}
          {/*</div>*/}

          <div>
            <h3>Local:</h3>
            <div className="max-w-[500px]">
              {video?.track?.kind === "video" && <VideoPlayer stream={video?.stream} />}
              {audio?.track?.kind === "audio" && <AudioVisualizer stream={audio?.stream} />}
              {screenShare?.track?.kind === "video" && <VideoPlayer stream={screenShare?.stream} />}
            </div>
          </div>
          {showStreaming && (
            <div>
              <h3>Streaming:</h3>
              {local.map(({ trackId, stream, track }) => {
                // console.log({ trackId, stream, track });
                return (
                  <Fragment key={trackId}>
                    <div className="max-w-[500px]">
                      {track?.kind === "video" && <VideoPlayer key={trackId} stream={stream} />}
                      {track?.kind === "audio" && <AudioVisualizer stream={stream} />}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainControls;
