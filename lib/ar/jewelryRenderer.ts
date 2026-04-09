import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type {
  AssetRenderMode,
  AttachmentPose,
  JewelryAsset,
  ViewportSize
} from "@/lib/ar/types";

class JewelryRenderer {
  private activeAssetGroup: Group | null = null;
  private readonly camera: OrthographicCamera;
  private readonly calibrationGroup: Group;
  private readonly canvasElement: HTMLCanvasElement;
  private readonly loader: GLTFLoader;
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private viewportSize: ViewportSize = {
    height: 1,
    width: 1
  };

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;
    this.camera = new OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    this.loader = new GLTFLoader();
    this.scene = new Scene();
    this.calibrationGroup = new Group();
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvasElement,
      powerPreference: "high-performance"
    });

    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearAlpha(0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new AmbientLight(0xffffff, 1.8);
    const keyLight = new DirectionalLight(0xffefc8, 1.8);
    keyLight.position.set(120, 220, 260);

    const fillLight = new DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(-160, -60, 180);

    this.scene.add(ambientLight, keyLight, fillLight, this.calibrationGroup);
  }

  public applyPose = (attachmentPose: AttachmentPose): void => {
    if (!this.activeAssetGroup) {
      return;
    }

    this.calibrationGroup.visible = attachmentPose.visible;

    if (!attachmentPose.visible) {
      this.render();
      return;
    }

    this.calibrationGroup.position.set(
      attachmentPose.position[0],
      attachmentPose.position[1],
      attachmentPose.position[2]
    );
    this.calibrationGroup.quaternion.set(
      attachmentPose.quaternion[0],
      attachmentPose.quaternion[1],
      attachmentPose.quaternion[2],
      attachmentPose.quaternion[3]
    );
    this.calibrationGroup.scale.setScalar(attachmentPose.scale);
    this.render();
  };

  public dispose = (): void => {
    if (this.activeAssetGroup) {
      this.disposeObject(this.activeAssetGroup);
      this.calibrationGroup.remove(this.activeAssetGroup);
      this.activeAssetGroup = null;
    }

    this.renderer.dispose();
  };

  public getViewportSize = (): ViewportSize => {
    return this.viewportSize;
  };

  public loadAsset = async (
    jewelryAsset: JewelryAsset
  ): Promise<AssetRenderMode> => {
    const nextAssetGroup = new Group();
    nextAssetGroup.position.set(
      jewelryAsset.positionOffset[0],
      jewelryAsset.positionOffset[1],
      jewelryAsset.positionOffset[2]
    );
    nextAssetGroup.rotation.set(
      jewelryAsset.rotationOffset[0],
      jewelryAsset.rotationOffset[1],
      jewelryAsset.rotationOffset[2]
    );
    nextAssetGroup.scale.setScalar(jewelryAsset.modelScale);

    let assetRenderMode: AssetRenderMode = "gltf";

    try {
      const loadedScene = await this.loader.loadAsync(jewelryAsset.modelUrl);
      const normalizedAsset = this.normalizeAsset(loadedScene.scene);
      nextAssetGroup.add(normalizedAsset);
    } catch {
      assetRenderMode = "fallback";
      nextAssetGroup.add(this.createFallbackRing());
    }

    if (this.activeAssetGroup) {
      this.disposeObject(this.activeAssetGroup);
      this.calibrationGroup.remove(this.activeAssetGroup);
    }

    this.activeAssetGroup = nextAssetGroup;
    this.calibrationGroup.add(nextAssetGroup);
    this.render();

    return assetRenderMode;
  };

  public render = (): void => {
    this.renderer.render(this.scene, this.camera);
  };

  public resize = (nextWidth: number, nextHeight: number): void => {
    this.viewportSize = {
      height: nextHeight,
      width: nextWidth
    };

    this.camera.left = -nextWidth / 2;
    this.camera.right = nextWidth / 2;
    this.camera.top = nextHeight / 2;
    this.camera.bottom = -nextHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(nextWidth, nextHeight, false);
    this.render();
  };

  private createFallbackRing = (): Group => {
    const fallbackGroup = new Group();
    const ringBody = new Mesh(
      new TorusGeometry(0.5, 0.18, 32, 96),
      new MeshStandardMaterial({
        color: 0xd2a15e,
        metalness: 0.98,
        roughness: 0.16
      })
    );

    fallbackGroup.add(ringBody);
    return fallbackGroup;
  };

  private disposeObject = (inputObject: Object3D): void => {
    inputObject.traverse((sceneChild) => {
      const sceneMesh = sceneChild as Mesh;

      if (!sceneMesh.isMesh) {
        return;
      }

      sceneMesh.geometry.dispose();

      if (Array.isArray(sceneMesh.material)) {
        sceneMesh.material.forEach((materialInstance) => {
          materialInstance.dispose();
        });
        return;
      }

      sceneMesh.material.dispose();
    });
  };

  private normalizeAsset = (inputObject: Object3D): Group => {
    const normalizedGroup = new Group();
    const workingObject = inputObject.clone(true);
    const boundingBox = new Box3().setFromObject(workingObject);
    const boxCenter = boundingBox.getCenter(new Vector3());
    const boxSize = boundingBox.getSize(new Vector3());
    const maxDimension = Math.max(boxSize.x, boxSize.y, boxSize.z, 1);

    workingObject.position.sub(boxCenter);
    workingObject.scale.multiplyScalar(1 / maxDimension);

    workingObject.traverse((sceneChild) => {
      const sceneMesh = sceneChild as Mesh;

      if (!sceneMesh.isMesh) {
        return;
      }

      sceneMesh.castShadow = false;
      sceneMesh.receiveShadow = false;
    });

    normalizedGroup.add(workingObject);
    return normalizedGroup;
  };
}

export { JewelryRenderer };
