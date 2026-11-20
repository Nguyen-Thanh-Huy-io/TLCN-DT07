import { LandingView } from '@/features/landing/components/LandingView';
import { fetchLandingData } from '@/features/landing/landing.adapter';

export default async function HomePage() {
  const data = await fetchLandingData();
  return <LandingView data={data} />;
}
