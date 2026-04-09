type ZoomCapabilities = {
  zoom?: {
    max?: number;
    min?: number;
  };
};

class CameraSession {
  private activeStream: MediaStream | null = null;

  public start = async (videoElement: HTMLVideoElement): Promise<void> => {
    this.stop();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("MediaDevices API недоступен.");
    }

    const primaryConstraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: {
          ideal: "environment"
        },
        frameRate: {
          ideal: 30,
          max: 60
        },
        height: {
          ideal: 1280
        },
        width: {
          ideal: 720
        }
      }
    };

    const fallbackConstraints: MediaStreamConstraints = {
      audio: false,
      video: true
    };

    try {
      this.activeStream = await navigator.mediaDevices.getUserMedia(
        primaryConstraints
      );
    } catch (primaryError) {
      if (
        primaryError instanceof DOMException &&
        primaryError.name === "NotAllowedError"
      ) {
        throw primaryError;
      }

      this.activeStream = await navigator.mediaDevices.getUserMedia(
        fallbackConstraints
      );
    }

    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.srcObject = this.activeStream;

    await this.waitForMetadata(videoElement);
    await this.resetTrackZoom();
    await videoElement.play();
  };

  public stop = (): void => {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((mediaStreamTrack) => {
        mediaStreamTrack.stop();
      });
    }

    this.activeStream = null;
  };

  private waitForMetadata = async (
    videoElement: HTMLVideoElement
  ): Promise<void> => {
    if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const handleLoadedMetadata = () => {
        cleanupListeners();
        resolve();
      };

      const handleError = () => {
        cleanupListeners();
        reject(new Error("Не удалось получить метаданные видеопотока."));
      };

      const cleanupListeners = () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.removeEventListener("error", handleError);
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata, {
        once: true
      });
      videoElement.addEventListener("error", handleError, {
        once: true
      });
    });
  };

  private resetTrackZoom = async (): Promise<void> => {
    const activeVideoTrack = this.activeStream?.getVideoTracks()[0];

    if (!activeVideoTrack || !("getCapabilities" in activeVideoTrack)) {
      return;
    }

    const trackCapabilities = (
      activeVideoTrack.getCapabilities?.() as ZoomCapabilities | undefined
    )?.zoom;

    if (!trackCapabilities) {
      return;
    }

    const minimumZoom =
      typeof trackCapabilities.min === "number"
        ? trackCapabilities.min
        : 1;
    const zoomConstraints = {
      advanced: [
        {
          zoom: minimumZoom
        }
      ]
    } as unknown as MediaTrackConstraints;

    try {
      await activeVideoTrack.applyConstraints(zoomConstraints);
    } catch {
      return;
    }
  };
}

export { CameraSession };
