import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";
import {
  HAND_LANDMARKER_MODEL_URL,
  HAND_LANDMARKER_OPTIONS,
  MEDIAPIPE_WASM_ROOT
} from "@/lib/ar/constants";
import type { TrackingFrame, TrackingHandedness } from "@/lib/ar/types";

type HandLandmarkerCategory = {
  categoryName?: string;
  displayName?: string;
  score?: number;
};

type HandLandmarkerResult = {
  handedness?: HandLandmarkerCategory[][];
  handednesses?: HandLandmarkerCategory[][];
  landmarks?: Array<
    Array<{
      x: number;
      y: number;
      z: number;
    }>
  >;
};

class HandTrackingEngine {
  private handLandmarker: HandLandmarker | null = null;

  public initialize = async (): Promise<void> => {
    const visionFileset = await FilesetResolver.forVisionTasks(
      MEDIAPIPE_WASM_ROOT
    );

    try {
      this.handLandmarker = await HandLandmarker.createFromOptions(
        visionFileset,
        {
          ...HAND_LANDMARKER_OPTIONS,
          baseOptions: {
            delegate: "GPU",
            modelAssetPath: HAND_LANDMARKER_MODEL_URL
          }
        }
      );
    } catch {
      this.handLandmarker = await HandLandmarker.createFromOptions(
        visionFileset,
        {
          ...HAND_LANDMARKER_OPTIONS,
          baseOptions: {
            delegate: "CPU",
            modelAssetPath: HAND_LANDMARKER_MODEL_URL
          }
        }
      );
    }
  };

  public dispose = (): void => {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  };

  public getTrackingFrame = (
    videoElement: HTMLVideoElement,
    timestampMs: number
  ): TrackingFrame | null => {
    if (!this.handLandmarker || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    const detectionResult = this.handLandmarker.detectForVideo(
      videoElement,
      timestampMs
    ) as HandLandmarkerResult;
    const primaryHandLandmarks = detectionResult.landmarks?.[0];
    const primaryHandedness =
      detectionResult.handednesses?.[0]?.[0] ??
      detectionResult.handedness?.[0]?.[0];

    if (!primaryHandLandmarks || primaryHandLandmarks.length === 0) {
      return null;
    }

    return {
      confidence: primaryHandedness?.score ?? 0.85,
      handedness: this.resolveHandedness(primaryHandedness),
      isVisible: true,
      landmarks: primaryHandLandmarks.map((landmark) => {
        return {
          x: landmark.x,
          y: landmark.y,
          z: landmark.z
        };
      }),
      timestampMs
    };
  };

  private resolveHandedness = (
    handednessCategory?: HandLandmarkerCategory
  ): TrackingHandedness => {
    const resolvedValue = (
      handednessCategory?.displayName ??
      handednessCategory?.categoryName ??
      "unknown"
    ).toLowerCase();

    if (resolvedValue.includes("left")) {
      return "left";
    }

    if (resolvedValue.includes("right")) {
      return "right";
    }

    return "unknown";
  };
}

export { HandTrackingEngine };
