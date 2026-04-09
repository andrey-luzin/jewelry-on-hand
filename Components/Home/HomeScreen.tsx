import { PrimaryLink } from "@/Components/UI/PrimaryLink";

const HomeScreen = () => {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-grid">
          <div>
            <p className="hero-kicker">AR Jewelry MVP</p>
            <h1 className="hero-title">Примерка кольца прямо на руке.</h1>
            <p className="hero-text">
              Мобильный web-сценарий на Next.js, TypeScript, MediaPipe и
              Three.js: камера отслеживает кисть, а 3D-кольцо удерживается на
              безымянном пальце и реагирует на движение руки в реальном времени.
            </p>
            <div className="hero-actions">
              <PrimaryLink href="/try-on" variant="primary">
                Открыть AR-экран
              </PrimaryLink>
              <PrimaryLink
                href="https://cartier-virtualtryon.s3.eu-west-3.amazonaws.com/index.html?pId=B4216900&language=enu&country=US&origin=https://www.cartier.com/en-us/jewelry/rings/juste-un-clou/juste-un-clou-ring-classic-model-diamonds-CRB4216900.html&typeOfPdt=ringwat"
                target="_blank"
                rel="noreferrer"
                variant="ghost"
              >
                Посмотреть референс
              </PrimaryLink>
            </div>
          </div>
          <div className="hero-feature-grid">
            <article className="hero-feature">
              <p className="hero-feature-label">Трекинг</p>
              <p className="hero-feature-text">
                MediaPipe Hand Landmarker в live video режиме, одна рука и один
                безымянный палец для MVP.
              </p>
            </article>
            <article className="hero-feature">
              <p className="hero-feature-label">Рендер</p>
              <p className="hero-feature-text">
                Прозрачный Three.js canvas поверх живого видеопотока с
                адаптивным размером и сглаженной позой.
              </p>
            </article>
            <article className="hero-feature">
              <p className="hero-feature-label">Расширяемость</p>
              <p className="hero-feature-text">
                Конфиг ассетов и стратегии привязки вынесены отдельно, чтобы
                позже добавить браслеты, часы или другие типы украшений.
              </p>
            </article>
            <article className="hero-feature">
              <p className="hero-feature-label">GLB pipeline</p>
              <p className="hero-feature-text">
                Основной контракт построен вокруг
                <span className="hero-code"> /public/models/demo-ring.glb</span>.
                Если файла пока нет, экран использует процедурное демо-кольцо.
              </p>
            </article>
          </div>
        </div>
        <p className="hero-note">
          Экран примерки рассчитан на современные мобильные браузеры по HTTPS:
          Safari на iPhone и Chrome на Android. Для стабильного результата
          держите кисть в кадре при хорошем освещении и без сильного blur.
        </p>
      </section>
    </main>
  );
};

export { HomeScreen };
