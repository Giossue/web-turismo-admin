import { connection } from "next/server";

import { LandingPage } from "@/components/landing/landing-page";
import { getApiHealth, getPublishedCenters } from "@/lib/api";

export default async function HomePage() {
  // Se renderiza por solicitud: la API no está disponible durante `next build`
  // (Docker). Las respuestas de la API se reutilizan 60 s (ver `src/lib/api.ts`).
  await connection();
  const [centers, apiOnline] = await Promise.all([
    getPublishedCenters().catch(() => []),
    getApiHealth(),
  ]);
  return <LandingPage centers={centers} apiOnline={apiOnline} />;
}
