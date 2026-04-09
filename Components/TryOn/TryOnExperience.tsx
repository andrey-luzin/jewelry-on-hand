"use client";

import { TryOnOverlay } from "@/Components/TryOn/TryOnOverlay";
import { useTryOnExperience } from "@/lib/ar/useTryOnExperience";

const TryOnExperience = () => {
  const {
    canvasRef,
    experienceState,
    handleRetryRequest,
    mediaFrameStyle,
    videoRef
  } = useTryOnExperience();

  return (
    <main className="try-on-page">
      <section className="try-on-stage">
        <div className="try-on__media-frame" style={mediaFrameStyle}>
          <video
            ref={videoRef}
            className="try-on__video"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="try-on__canvas" />
        </div>
        <TryOnOverlay
          experienceState={experienceState}
          onRetryRequest={handleRetryRequest}
        />
      </section>
    </main>
  );
};

export { TryOnExperience };
