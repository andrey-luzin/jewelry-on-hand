import { describe, expect, it } from "vitest";
import { demoRingAsset } from "@/lib/ar/jewelryAssets";
import { RingPoseSolver } from "@/lib/ar/poseSolver";
import type { TrackingFrame, TrackingLandmark } from "@/lib/ar/types";

const createTrackingLandmarks = (): TrackingLandmark[] => {
  return Array.from({ length: 21 }, () => {
    return {
      x: 0.5,
      y: 0.5,
      z: 0
    };
  });
};

const createTrackingFrame = (
  landmarkOverrides: Partial<Record<number, TrackingLandmark>>,
  timestampMs: number
): TrackingFrame => {
  const landmarks = createTrackingLandmarks();

  Object.entries(landmarkOverrides).forEach(([landmarkIndex, landmarkValue]) => {
    landmarks[Number(landmarkIndex)] = landmarkValue;
  });

  return {
    confidence: 0.91,
    handedness: "right",
    isVisible: true,
    landmarks,
    timestampMs
  };
};

const viewportSize = {
  height: 844,
  width: 390
};

describe("RingPoseSolver", () => {
  it("возвращает видимую позу для валидного положения руки", () => {
    const ringPoseSolver = new RingPoseSolver();
    const trackingFrame = createTrackingFrame(
      {
        0: { x: 0.48, y: 0.82, z: 0.02 },
        5: { x: 0.34, y: 0.61, z: 0.03 },
        9: { x: 0.46, y: 0.59, z: 0.01 },
        13: { x: 0.56, y: 0.62, z: 0.01 },
        14: { x: 0.58, y: 0.48, z: -0.01 },
        15: { x: 0.6, y: 0.36, z: -0.03 },
        17: { x: 0.67, y: 0.63, z: 0.02 }
      },
      1000
    );

    const attachmentPose = ringPoseSolver.solvePose(
      trackingFrame,
      demoRingAsset,
      viewportSize,
      1000
    );

    expect(attachmentPose.visible).toBe(true);
    expect(attachmentPose.position[0]).toBeGreaterThan(10);
    expect(attachmentPose.position[1]).toBeLessThan(-20);
    expect(attachmentPose.scale).toBeGreaterThan(18);
    expect(attachmentPose.quaternion[3]).not.toBe(0);
  });

  it("сглаживает резкое смещение между кадрами", () => {
    const ringPoseSolver = new RingPoseSolver();
    const firstFrame = createTrackingFrame(
      {
        0: { x: 0.48, y: 0.82, z: 0.02 },
        5: { x: 0.34, y: 0.61, z: 0.03 },
        9: { x: 0.46, y: 0.59, z: 0.01 },
        13: { x: 0.56, y: 0.62, z: 0.01 },
        14: { x: 0.58, y: 0.48, z: -0.01 },
        15: { x: 0.6, y: 0.36, z: -0.03 },
        17: { x: 0.67, y: 0.63, z: 0.02 }
      },
      1000
    );
    const secondFrame = createTrackingFrame(
      {
        0: { x: 0.58, y: 0.82, z: 0.02 },
        5: { x: 0.44, y: 0.61, z: 0.03 },
        9: { x: 0.56, y: 0.59, z: 0.01 },
        13: { x: 0.68, y: 0.62, z: 0.01 },
        14: { x: 0.7, y: 0.48, z: -0.01 },
        15: { x: 0.72, y: 0.36, z: -0.03 },
        17: { x: 0.79, y: 0.63, z: 0.02 }
      },
      1040
    );

    const firstPose = ringPoseSolver.solvePose(
      firstFrame,
      demoRingAsset,
      viewportSize,
      1000
    );
    const secondPose = ringPoseSolver.solvePose(
      secondFrame,
      demoRingAsset,
      viewportSize,
      1040
    );

    expect(secondPose.visible).toBe(true);
    expect(secondPose.position[0]).toBeGreaterThan(firstPose.position[0]);
    expect(secondPose.position[0]).toBeLessThan(85);
  });

  it("кратко удерживает последнюю позу при потере трекинга", () => {
    const ringPoseSolver = new RingPoseSolver();
    const trackingFrame = createTrackingFrame(
      {
        0: { x: 0.48, y: 0.82, z: 0.02 },
        5: { x: 0.34, y: 0.61, z: 0.03 },
        9: { x: 0.46, y: 0.59, z: 0.01 },
        13: { x: 0.56, y: 0.62, z: 0.01 },
        14: { x: 0.58, y: 0.48, z: -0.01 },
        15: { x: 0.6, y: 0.36, z: -0.03 },
        17: { x: 0.67, y: 0.63, z: 0.02 }
      },
      1000
    );

    const visiblePose = ringPoseSolver.solvePose(
      trackingFrame,
      demoRingAsset,
      viewportSize,
      1000
    );
    const heldPose = ringPoseSolver.solvePose(
      null,
      demoRingAsset,
      viewportSize,
      1120
    );

    expect(visiblePose.visible).toBe(true);
    expect(heldPose.visible).toBe(true);
    expect(heldPose.position).toEqual(visiblePose.position);
  });

  it("скрывает кольцо после истечения окна удержания", () => {
    const ringPoseSolver = new RingPoseSolver();
    const trackingFrame = createTrackingFrame(
      {
        0: { x: 0.48, y: 0.82, z: 0.02 },
        5: { x: 0.34, y: 0.61, z: 0.03 },
        9: { x: 0.46, y: 0.59, z: 0.01 },
        13: { x: 0.56, y: 0.62, z: 0.01 },
        14: { x: 0.58, y: 0.48, z: -0.01 },
        15: { x: 0.6, y: 0.36, z: -0.03 },
        17: { x: 0.67, y: 0.63, z: 0.02 }
      },
      1000
    );

    ringPoseSolver.solvePose(trackingFrame, demoRingAsset, viewportSize, 1000);
    const hiddenAttachmentPose = ringPoseSolver.solvePose(
      null,
      demoRingAsset,
      viewportSize,
      1300
    );

    expect(hiddenAttachmentPose.visible).toBe(false);
    expect(hiddenAttachmentPose.scale).toBe(0);
  });
});
