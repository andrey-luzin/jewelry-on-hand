"use client";

import type { CSSProperties } from "react";
import { startTransition, useEffect, useRef, useState } from "react";
import { CameraSession } from "@/lib/ar/cameraSession";
import { demoRingAsset } from "@/lib/ar/jewelryAssets";
import { HandTrackingEngine } from "@/lib/ar/handTrackingEngine";
import { JewelryRenderer } from "@/lib/ar/jewelryRenderer";
import { hiddenPose, RingPoseSolver } from "@/lib/ar/poseSolver";
import type { AssetRenderMode } from "@/lib/ar/types";
import { isMobileViewport } from "@/lib/ui/breakpoints";

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
  const [isMobileLayout, setIsMobileLayout] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return isMobileViewport(window.innerWidth);
  });
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
    let visualViewportResizeHandler: (() => void) | null = null;

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
      const viewportWidth = Math.round(
        window.visualViewport?.width ?? window.innerWidth
      );
      const viewportHeight = Math.round(
        window.visualViewport?.height ?? window.innerHeight
      );
      const nextIsMobileLayout = isMobileViewport(viewportWidth);
      const nextMediaFrameSize = resolveMediaFrameSize(
        videoElement,
        nextIsMobileLayout,
        viewportWidth,
        viewportHeight
      );
      setIsMobileLayout((currentIsMobileLayout) => {
        if (currentIsMobileLayout === nextIsMobileLayout) {
          return currentIsMobileLayout;
        }

        return nextIsMobileLayout;
      });
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

    const handleDeferredViewportResize = () => {
      window.requestAnimationFrame(() => {
        handleViewportResize();
      });
    };

    const syncDesktopMediaFrame = () => {
      handleViewportResize();

      window.requestAnimationFrame(() => {
        handleViewportResize();
      });
    };

    const bindViewportListeners = () => {
      window.addEventListener("orientationchange", handleDeferredViewportResize);
      window.addEventListener("resize", handleDeferredViewportResize);

      if (window.visualViewport) {
        visualViewportResizeHandler = () => {
          handleDeferredViewportResize();
        };
        window.visualViewport.addEventListener(
          "resize",
          visualViewportResizeHandler
        );
      }
    };

    const unbindViewportListeners = () => {
      window.removeEventListener(
        "orientationchange",
        handleDeferredViewportResize
      );
      window.removeEventListener("resize", handleDeferredViewportResize);

      if (window.visualViewport && visualViewportResizeHandler) {
        window.visualViewport.removeEventListener(
          "resize",
          visualViewportResizeHandler
        );
      }

      visualViewportResizeHandler = null;
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
        bindViewportListeners();
        handleViewportResize();

        const assetMode = await jewelryRenderer.loadAsset(demoRingAsset);
        cameraSession = new CameraSession();
        await cameraSession.start(videoElement);
        syncDesktopMediaFrame();
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
      unbindViewportListeners();
      handTrackingEngine?.dispose();
      cameraSession?.stop();
      jewelryRenderer?.dispose();
    };
  }, [retryToken]);

  return {
    canvasRef,
    experienceState,
    handleRetryRequest,
    isMobileLayout,
    mediaFrameStyle:
      isMobileLayout
        ? undefined
        : ({
            height: `${mediaFrameSize.height}px`,
            width: `${mediaFrameSize.width}px`
          } satisfies CSSProperties),
    videoRef
  };
};

const resolveMediaFrameSize = (
  videoElement: HTMLVideoElement,
  isMobileLayout: boolean,
  viewportWidth: number,
  viewportHeight: number
): MediaFrameSize => {
  if (isMobileLayout) {
    return {
      height: viewportHeight,
      width: viewportWidth
    };
  }

  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  if (!videoWidth || !videoHeight) {
    return {
      height: viewportHeight,
      width: viewportWidth
    };
  }

  const videoAspectRatio = videoWidth / videoHeight;
  const viewportAspectRatio = viewportWidth / viewportHeight;

  if (videoAspectRatio > viewportAspectRatio) {
    return {
      height: Math.round(viewportWidth / videoAspectRatio),
      width: viewportWidth
    };
  }

  return {
    height: viewportHeight,
    width: Math.round(viewportHeight * videoAspectRatio)
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
