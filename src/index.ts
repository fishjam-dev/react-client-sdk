export {
  create,
  // CreateJellyfishClient,
  // JellyfishContextProviderProps,
  UseConnect,
} from "./create";

export {
  PeerState,
  Track,
  PeerId,
  TrackId,
  TrackWithOrigin,
  Origin,
  PeerStatus,
  Selector,
  State,
  SetStore,
  Connectivity,
} from "./state.types";

export { Api } from "./api";

export {
  INITIAL_STATE,
  MediaReducer,
  userMediaReducer,
  useUserMedia,
  UseUserMediaAction,
  useUserMediaInternal,
  parseError,
} from "./useUserMedia";

export { useSetupMedia } from "./useMedia/index";

export {
  UseCameraAndMicrophoneResult,
  UseCameraResult,
  UseScreenshareResult,
  UseMicrophoneResult,
  UseSetupMediaResult,
  UseSetupMediaConfig,
} from "./useMedia/types";

export {
  AUDIO_TRACK_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
  SCREEN_SHARING_MEDIA_CONSTRAINTS,
  // getExactDeviceConstraint,
  // prepareConstraints,
  // prepareMediaTrackConstraints,
  // toMediaTrackConstraints,
} from "./useUserMedia/constraints";

export type {
  Peer,
  MessageEvents,
  SignalingUrl,
  CreateConfig,
  JellyfishClient,
  TrackBandwidthLimit,
  SimulcastBandwidthLimit,
  BandwidthLimit,
  WebRTCEndpointEvents,
  TrackContextEvents,
  Endpoint,
  SimulcastConfig,
  TrackContext,
  TrackEncoding,
  VadStatus,
  EncodingReason,
} from "@jellyfish-dev/ts-client-sdk";
