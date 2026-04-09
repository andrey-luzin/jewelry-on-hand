export const MEDIAPIPE_VERSION = "0.10.21";
export const MEDIAPIPE_WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const HAND_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export const HAND_LANDMARKER_OPTIONS = {
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  numHands: 1,
  runningMode: "VIDEO" as const
};

export const HAND_LANDMARK_INDEXES = {
  indexMcp: 5,
  middleMcp: 9,
  pinkyMcp: 17,
  ringDip: 15,
  ringMcp: 13,
  ringPip: 14,
  wrist: 0
};

export const RING_POSE_SETTINGS = {
  holdDurationMs: 180,
  positionSmoothing: 0.34,
  rotationSmoothing: 0.22,
  scaleMultiplier: 0.68,
  scaleSmoothing: 0.28
};
