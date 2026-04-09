import type { JewelryAsset } from "@/lib/ar/types";

export const demoRingAsset: JewelryAsset = {
  anchorStrategy: "ringFinger",
  baseScale: 1.0,
  id: "demo-ring",
  // modelUrl: "/models/demo-ring.glb",
  modelUrl: "/models/ring.glb",
  modelScale: 1.9,
  name: "Demo Ring",
  positionOffset: [0.85, 0, 0],
  rotationOffset: [0.1, 0, 0],
  type: "ring"
};
