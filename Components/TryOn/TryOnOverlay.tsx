import Link from "next/link";
import { PrimaryLink } from "@/Components/UI/PrimaryLink";
import { StatusPill } from "@/Components/UI/StatusPill";
import type {
  TryOnExperiencePhase,
  TryOnExperienceState
} from "@/lib/ar/useTryOnExperience";

type TryOnOverlayProps = {
  experienceState: TryOnExperienceState;
  onRetryRequest: () => void;
};

type OverlayContent = {
  detail: string;
  eyebrow: string;
  hint: string;
  showRetryButton: boolean;
  statusLabel: string;
  statusTone: "danger" | "neutral" | "success" | "warning";
  title: string;
};

const overlayByPhase: Record<TryOnExperiencePhase, OverlayContent> = {
  "camera-denied": {
    eyebrow: "Camera Access",
    title: "Нужен доступ к камере",
    detail:
      "Разрешите доступ к камере в браузере, затем перезапустите сцену. Без live-видео трекинг руки не стартует.",
    hint: "После разрешения камера включится повторно без перезагрузки проекта.",
    statusLabel: "Камера заблокирована",
    statusTone: "danger",
    showRetryButton: true
  },
  error: {
    eyebrow: "Runtime Error",
    title: "AR-сцену не удалось запустить",
    detail:
      "Проверьте HTTPS, доступность камеры и сетевой доступ к MediaPipe runtime. После этого повторите запуск.",
    hint: "Если проблема остаётся, проверьте консоль браузера и доступность GLB-файла.",
    statusLabel: "Ошибка инициализации",
    statusTone: "danger",
    showRetryButton: true
  },
  initializing: {
    eyebrow: "Initializing",
    title: "Подготавливаем примерку",
    detail:
      "Запускаем камеру, загружаем MediaPipe Hand Landmarker и поднимаем прозрачный 3D-слой поверх видеопотока.",
    hint: "На мобильном устройстве первый старт может занять несколько секунд.",
    statusLabel: "Инициализация",
    statusTone: "neutral",
    showRetryButton: false
  },
  ready: {
    eyebrow: "Live Tracking",
    title: "Наведите камеру на кисть",
    detail:
      "Держите руку в кадре так, чтобы безымянный палец был виден целиком. При обнаружении кисти кольцо автоматически появится на пальце.",
    hint: "Лучше всего работает при ровном свете и умеренных движениях руки.",
    statusLabel: "Ожидаем руку",
    statusTone: "warning",
    showRetryButton: false
  },
  unsupported: {
    eyebrow: "Unsupported",
    title: "Нужен современный мобильный браузер",
    detail:
      "Этот экран рассчитан на Safari на iPhone и Chrome на Android в защищённом HTTPS-контексте с доступом к WebGL и MediaDevices API.",
    hint: "Откройте проект на мобильном устройстве и проверьте, что страница работает по HTTPS.",
    statusLabel: "Браузер не подходит",
    statusTone: "warning",
    showRetryButton: false
  }
};

const resolveOverlayContent = (
  experienceState: TryOnExperienceState
): OverlayContent => {
  if (experienceState.phase !== "ready") {
    return overlayByPhase[experienceState.phase];
  }

  if (experienceState.isHandVisible) {
    return {
      eyebrow: "Live Tracking",
      title: "Кольцо зафиксировано на пальце",
      detail:
        "Трекинг активен. Двигайте кистью плавно: позиция, угол и масштаб модели будут обновляться по landmark-ам руки.",
      hint:
        "Если кисть временно выйдет из кадра, сцена коротко удержит последнюю позу и затем мягко скроет кольцо.",
      statusLabel: "Трекинг активен",
      statusTone: "success",
      showRetryButton: false
    };
  }

  return overlayByPhase.ready;
};

const TryOnOverlay = ({
  experienceState,
  onRetryRequest
}: TryOnOverlayProps) => {
  const overlayContent = resolveOverlayContent(experienceState);

  const handleRetryButtonClick = () => {
    onRetryRequest();
  };

  return (
    <div className="try-on__shell">
      <div className="try-on__topbar">
        <div className="try-on__brand">
          <span>Jewelry On Hand</span>
        </div>
        <PrimaryLink href="/" variant="ghost">
          На главную
        </PrimaryLink>
      </div>
      <div className="try-on__panel">
        <div className="try-on__panel-header">
          <StatusPill tone={overlayContent.statusTone}>
            {overlayContent.statusLabel}
          </StatusPill>
          <p className="try-on__eyebrow">{overlayContent.eyebrow}</p>
          <h1 className="try-on__title">{overlayContent.title}</h1>
          <p className="try-on__text">
            {experienceState.errorMessage ?? overlayContent.detail}
          </p>
        </div>
        <ul className="try-on__facts">
          <li className="try-on__fact">
            <span className="try-on__fact-label">Палец</span>
            <span className="try-on__fact-text">
              Автопривязка к безымянному пальцу наиболее уверенно обнаруженной
              руки.
            </span>
          </li>
          <li className="try-on__fact">
            <span className="try-on__fact-label">Модель</span>
            <span className="try-on__fact-text">
              {experienceState.assetMode === "fallback"
                ? "Используется процедурное демо-кольцо. Для реального ассета добавьте /public/models/demo-ring.glb."
                : "Подключён GLB-ассет из /public/models/demo-ring.glb."}
            </span>
          </li>
          <li className="try-on__fact">
            <span className="try-on__fact-label">Стек</span>
            <span className="try-on__fact-text">
              Next.js App Router, MediaPipe Hand Landmarker и Three.js overlay.
            </span>
          </li>
        </ul>
        <p className="try-on__hint">{overlayContent.hint}</p>
        <div className="try-on__panel-actions">
          {overlayContent.showRetryButton ? (
            <button
              type="button"
              className="button-action button-action--primary"
              onClick={handleRetryButtonClick}
            >
              Повторить запуск
            </button>
          ) : null}
          <Link
            className="button-link button-link--ghost"
            href="https://developers.google.com/mediapipe/solutions/vision/hand_landmarker"
            rel="noreferrer"
            target="_blank"
          >
            Документация MediaPipe
          </Link>
        </div>
      </div>
    </div>
  );
};

export { TryOnOverlay };
