"use client";

import type { CSSProperties } from "react";
import { startTransition, useEffect, useRef, useState } from "react";
import { CameraSession } from "@/lib/ar/cameraSession";
import { demoRingAsset } from "@/lib/ar/jewelryAssets";
import { HandTrackingEngine } from "@/lib/ar/handTrackingEngine";
import { JewelryRenderer } from "@/lib/ar/jewelryRenderer";
import { hiddenPose, RingPoseSolver } from "@/lib/ar/poseSolver";
import type { AssetRenderMode } from "@/lib/ar/types";

export type TryOnExperiencePhase =
  | "camera-denied"
  | "error"
  | "initializing"
  | "ready"
  | "unsupported";

export type TryOnExperienceState = {
  assetMode: AssetRenderMode;
  errorMessage: string | null;
  isHandVisible: boolean;
  phase: TryOnExperiencePhase;
};

const initialExperienceState: TryOnExperienceState = {
  assetMode: "gltf",
  errorMessage: null,
  isHandVisible: false,
  phase: "initializing"
};

type MediaFrameSize = {
  height: number;
  width: number;
};

const getInitialMediaFrameSize = (): MediaFrameSize => {
  if (typeof window === "undefined") {
    return {
      height: 844,
      width: 390
    };
  }

  return {
    height: window.innerHeight,
    width: window.innerWidth
  };
};

const useTryOnExperience = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [experienceState, setExperienceState] = useState(
    initialExperienceState
  );
  const [mediaFrameSize, setMediaFrameSize] = useState<MediaFrameSize>(
    getInitialMediaFrameSize
  );
  const [retryToken, setRetryToken] = useState(0);

  const handleRetryRequest = () => {
    setRetryToken((currentToken) => currentToken + 1);
  };

  useEffect(() => {
    const canvasElement = canvasRef.current;
    const videoElement = videoRef.current;

    if (!canvasElement || !videoElement) {
      return;
    }

    let isDisposed = false;
    let cameraSession: CameraSession | null = null;
    let handTrackingEngine: HandTrackingEngine | null = null;
    let jewelryRenderer: JewelryRenderer | null = null;
    let ringPoseSolver: RingPoseSolver | null = null;
    let currentHandVisibility = false;

    const updateExperienceState = (
      statePatch: Partial<TryOnExperienceState>
    ) => {
      if (isDisposed) {
        return;
      }

      setExperienceState((currentState) => {
        return {
          ...currentState,
          ...statePatch
        };
      });
    };

    const stopAnimationLoop = () => {
      if (animationFrameIdRef.current !== null) {
        window.cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };

    const syncHandVisibility = (nextHandVisibility: boolean) => {
      if (nextHandVisibility === currentHandVisibility) {
        return;
      }

      currentHandVisibility = nextHandVisibility;

      startTransition(() => {
        updateExperienceState({
          isHandVisible: nextHandVisibility
        });
      });
    };

    const handleViewportResize = () => {
      const nextMediaFrameSize = resolveMediaFrameSize(videoElement);
      setMediaFrameSize((currentFrameSize) => {
        if (
          currentFrameSize.width === nextMediaFrameSize.width &&
          currentFrameSize.height === nextMediaFrameSize.height
        ) {
          return currentFrameSize;
        }

        return nextMediaFrameSize;
      });

      if (!jewelryRenderer) {
        return;
      }

      jewelryRenderer.resize(
        nextMediaFrameSize.width,
        nextMediaFrameSize.height
      );
    };

    const renderFrame = () => {
      if (
        isDisposed ||
        !handTrackingEngine ||
        !jewelryRenderer ||
        !ringPoseSolver
      ) {
        return;
      }

      const timestampMs = performance.now();
      const trackingFrame = handTrackingEngine.getTrackingFrame(
        videoElement,
        timestampMs
      );
      const attachmentPose = ringPoseSolver.solvePose(
        trackingFrame,
        demoRingAsset,
        jewelryRenderer.getViewportSize(),
        timestampMs
      );

      jewelryRenderer.applyPose(attachmentPose);
      syncHandVisibility(attachmentPose.visible);
      animationFrameIdRef.current = window.requestAnimationFrame(renderFrame);
    };

    const initializeExperience = async () => {
      currentHandVisibility = false;
      updateExperienceState({
        assetMode: "gltf",
        errorMessage: null,
        isHandVisible: false,
        phase: "initializing"
      });

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        updateExperienceState({
          phase: "unsupported"
        });
        return;
      }

      try {
        jewelryRenderer = new JewelryRenderer(canvasElement);
        handleViewportResize();
        window.addEventListener("orientationchange", handleViewportResize);
        window.addEventListener("resize", handleViewportResize);

        const assetMode = await jewelryRenderer.loadAsset(demoRingAsset);
        cameraSession = new CameraSession();
        await cameraSession.start(videoElement);
        handleViewportResize();
        handTrackingEngine = new HandTrackingEngine();
        await handTrackingEngine.initialize();
        ringPoseSolver = new RingPoseSolver();

        if (isDisposed) {
          return;
        }

        updateExperienceState({
          assetMode,
          phase: "ready"
        });
        renderFrame();
      } catch (runtimeError) {
        const errorMessage = resolveExperienceFailure(runtimeError);
        stopAnimationLoop();
        jewelryRenderer?.applyPose(hiddenPose);
        updateExperienceState(errorMessage);
      }
    };

    void initializeExperience();

    return () => {
      isDisposed = true;
      stopAnimationLoop();
      window.removeEventListener("orientationchange", handleViewportResize);
      window.removeEventListener("resize", handleViewportResize);
      handTrackingEngine?.dispose();
      cameraSession?.stop();
      jewelryRenderer?.dispose();
    };
  }, [retryToken]);

  return {
    canvasRef,
    experienceState,
    handleRetryRequest,
    mediaFrameStyle: {
      height: `${mediaFrameSize.height}px`,
      width: `${mediaFrameSize.width}px`
    } satisfies CSSProperties,
    videoRef
  };
};

const resolveMediaFrameSize = (
  videoElement: HTMLVideoElement
): MediaFrameSize => {
  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight;
  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  if (!videoWidth || !videoHeight) {
    return {
      height: availableHeight,
      width: availableWidth
    };
  }

  const videoAspectRatio = videoWidth / videoHeight;
  const viewportAspectRatio = availableWidth / availableHeight;

  if (videoAspectRatio > viewportAspectRatio) {
    return {
      height: Math.round(availableWidth / videoAspectRatio),
      width: availableWidth
    };
  }

  return {
    height: availableHeight,
    width: Math.round(availableHeight * videoAspectRatio)
  };
};

const resolveExperienceFailure = (
  runtimeError: unknown
): Partial<TryOnExperienceState> => {
  if (runtimeError instanceof DOMException) {
    if (runtimeError.name === "NotAllowedError") {
      return {
        errorMessage: null,
        phase: "camera-denied"
      };
    }

    if (runtimeError.name === "NotFoundError") {
      return {
        errorMessage: "Подходящая камера не найдена на устройстве.",
        phase: "error"
      };
    }
  }

  if (runtimeError instanceof Error) {
    return {
      errorMessage: runtimeError.message,
      phase: "error"
    };
  }

  return {
    errorMessage: "Не удалось завершить инициализацию AR-рантайма.",
    phase: "error"
  };
};

export { useTryOnExperience };
