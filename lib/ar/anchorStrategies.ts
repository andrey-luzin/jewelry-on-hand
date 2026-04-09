import { HAND_LANDMARK_INDEXES, RING_POSE_SETTINGS } from "@/lib/ar/constants";
import {
  clampNumber,
  crossVectors,
  dotVectors,
  getVectorLength,
  isFiniteQuaternion,
  isFiniteVector,
  normalizeVector,
  quaternionFromBasis,
  subtractVectors,
  toScenePoint
} from "@/lib/ar/math";
import type {
  AnchorStrategy,
  AttachmentPose,
  Vector3Tuple
} from "@/lib/ar/types";

const ringFingerAnchorStrategy: AnchorStrategy = ({
  jewelryAsset,
  trackingFrame,
  viewportSize
}) => {
  if (trackingFrame.landmarks.length <= HAND_LANDMARK_INDEXES.pinkyMcp) {
    return null;
  }

  const wristLandmark = trackingFrame.landmarks[HAND_LANDMARK_INDEXES.wrist];
  const indexMcpLandmark =
    trackingFrame.landmarks[HAND_LANDMARK_INDEXES.indexMcp];
  const middleMcpLandmark =
    trackingFrame.landmarks[HAND_LANDMARK_INDEXES.middleMcp];
  const ringMcpLandmark = trackingFrame.landmarks[HAND_LANDMARK_INDEXES.ringMcp];
  const ringPipLandmark = trackingFrame.landmarks[HAND_LANDMARK_INDEXES.ringPip];
  const pinkyMcpLandmark =
    trackingFrame.landmarks[HAND_LANDMARK_INDEXES.pinkyMcp];

  const wristPoint = toScenePoint(wristLandmark, viewportSize);
  const indexMcpPoint = toScenePoint(indexMcpLandmark, viewportSize);
  const middleMcpPoint = toScenePoint(middleMcpLandmark, viewportSize);
  const ringMcpPoint = toScenePoint(ringMcpLandmark, viewportSize);
  const ringPipPoint = toScenePoint(ringPipLandmark, viewportSize);
  const pinkyMcpPoint = toScenePoint(pinkyMcpLandmark, viewportSize);

  const fingerDirection = normalizeVector(
    subtractVectors(ringPipPoint, ringMcpPoint),
    [1, 0, 0]
  );
  const palmSpread = normalizeVector(
    subtractVectors(pinkyMcpPoint, indexMcpPoint),
    [0, 1, 0]
  );
  let palmNormal = normalizeVector(
    crossVectors(subtractVectors(indexMcpPoint, wristPoint), subtractVectors(pinkyMcpPoint, wristPoint)),
    [0, 0, 1]
  );
  const wristToMiddle = normalizeVector(
    subtractVectors(middleMcpPoint, wristPoint),
    [0, -1, 0]
  );

  if (dotVectors(palmNormal, wristToMiddle) < 0) {
    palmNormal = [
      -palmNormal[0],
      -palmNormal[1],
      -palmNormal[2]
    ];
  }

  let yAxis = normalizeVector(crossVectors(palmNormal, fingerDirection), palmSpread);

  if (getVectorLength(yAxis) < 1e-6) {
    yAxis = palmSpread;
  }

  const zAxis = normalizeVector(crossVectors(fingerDirection, yAxis), palmNormal);
  const quaternion = quaternionFromBasis(fingerDirection, yAxis, zAxis);

  if (!isFiniteQuaternion(quaternion)) {
    return null;
  }

  const anchorPoint: Vector3Tuple = [
    ringMcpPoint[0] + (ringPipPoint[0] - ringMcpPoint[0]) * 0.38,
    ringMcpPoint[1] + (ringPipPoint[1] - ringMcpPoint[1]) * 0.38,
    ringMcpPoint[2] + (ringPipPoint[2] - ringMcpPoint[2]) * 0.38
  ];

  if (!isFiniteVector(anchorPoint)) {
    return null;
  }

  const fingerSegmentLength = getVectorLength(
    subtractVectors(ringPipPoint, ringMcpPoint)
  );
  const resolvedScale = clampNumber(
    fingerSegmentLength *
      jewelryAsset.baseScale *
      RING_POSE_SETTINGS.scaleMultiplier,
    18,
    54
  );

  const attachmentPose: AttachmentPose = {
    position: [...anchorPoint],
    quaternion,
    scale: resolvedScale,
    trackingConfidence: trackingFrame.confidence,
    visible: true
  };

  return attachmentPose;
};

export const anchorStrategies = {
  ringFinger: ringFingerAnchorStrategy
};
