export type AttachmentType = "ring";
export type AnchorStrategyName = "ringFinger";
export type AssetRenderMode = "fallback" | "gltf";
export type TrackingHandedness = "left" | "right" | "unknown";

export type Vector3Tuple = [number, number, number];
export type QuaternionTuple = [number, number, number, number];

export type TrackingLandmark = {
  x: number;
  y: number;
  z: number;
};

export type JewelryAsset = {
  anchorStrategy: AnchorStrategyName;
  baseScale: number;
  id: string;
  modelUrl: string;
  modelScale: number;
  name: string;
  positionOffset: Vector3Tuple;
  rotationOffset: Vector3Tuple;
  type: AttachmentType;
};

export type TrackingFrame = {
  confidence: number;
  handedness: TrackingHandedness;
  isVisible: boolean;
  landmarks: TrackingLandmark[];
  timestampMs: number;
};

export type AttachmentPose = {
  position: Vector3Tuple;
  quaternion: QuaternionTuple;
  scale: number;
  trackingConfidence: number;
  visible: boolean;
};

export type ViewportSize = {
  height: number;
  width: number;
};

export type AnchorStrategyInput = {
  jewelryAsset: JewelryAsset;
  trackingFrame: TrackingFrame;
  viewportSize: ViewportSize;
};

export type AnchorStrategy = (
  strategyInput: AnchorStrategyInput
) => AttachmentPose | null;
