import { LandingPage } from "@/components/landing/landing-page";
import { getApiHealth, getPublishedCenters } from "@/lib/api";

export default async function HomePage() {
  const [centers, apiOnline] = await Promise.all([
    getPublishedCenters().catch(() => []),
    getApiHealth(),
  ]);
  return <LandingPage centers={centers} apiOnline={apiOnline} />;
}
