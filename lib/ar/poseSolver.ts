import { anchorStrategies } from "@/lib/ar/anchorStrategies";
import { RING_POSE_SETTINGS } from "@/lib/ar/constants";
import {
  lerpNumber,
  lerpVectors,
  nlerpQuaternions
} from "@/lib/ar/math";
import type {
  AttachmentPose,
  JewelryAsset,
  TrackingFrame,
  ViewportSize
} from "@/lib/ar/types";

const hiddenPose: AttachmentPose = {
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: 0,
  trackingConfidence: 0,
  visible: false
};

class RingPoseSolver {
  private lastSeenTimestampMs = 0;
  private previousPose: AttachmentPose = hiddenPose;

  public solvePose = (
    trackingFrame: TrackingFrame | null,
    jewelryAsset: JewelryAsset,
    viewportSize: ViewportSize,
    timestampMs: number
  ): AttachmentPose => {
    if (!trackingFrame || !trackingFrame.isVisible) {
      return this.resolveMissingPose(timestampMs);
    }

    const rawPose = anchorStrategies[jewelryAsset.anchorStrategy]({
      jewelryAsset,
      trackingFrame,
      viewportSize
    });

    if (!rawPose) {
      return this.resolveMissingPose(timestampMs);
    }

    this.lastSeenTimestampMs = timestampMs;

    if (!this.previousPose.visible) {
      this.previousPose = rawPose;
      return rawPose;
    }

    const nextPose: AttachmentPose = {
      position: lerpVectors(
        this.previousPose.position,
        rawPose.position,
        RING_POSE_SETTINGS.positionSmoothing
      ),
      quaternion: nlerpQuaternions(
        this.previousPose.quaternion,
        rawPose.quaternion,
        RING_POSE_SETTINGS.rotationSmoothing
      ),
      scale: lerpNumber(
        this.previousPose.scale,
        rawPose.scale,
        RING_POSE_SETTINGS.scaleSmoothing
      ),
      trackingConfidence: rawPose.trackingConfidence,
      visible: true
    };

    this.previousPose = nextPose;
    return nextPose;
  };

  private resolveMissingPose = (timestampMs: number): AttachmentPose => {
    const elapsedSinceLastSeen = timestampMs - this.lastSeenTimestampMs;

    if (
      this.previousPose.visible &&
      elapsedSinceLastSeen <= RING_POSE_SETTINGS.holdDurationMs
    ) {
      return {
        ...this.previousPose,
        trackingConfidence: 0
      };
    }

    this.previousPose = hiddenPose;
    return hiddenPose;
  };
}

export { RingPoseSolver, hiddenPose };
