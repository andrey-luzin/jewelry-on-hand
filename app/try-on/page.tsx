import type { Metadata } from "next";
import { TryOnExperience } from "@/Components/TryOn/TryOnExperience";

export const metadata: Metadata = {
  title: "AR-примерка кольца",
  description: "Экран мобильной AR-примерки кольца на руке."
};

const TryOnPage = () => {
  return <TryOnExperience />;
};

export default TryOnPage;
