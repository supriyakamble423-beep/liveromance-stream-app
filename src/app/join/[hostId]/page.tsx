import { JoinClient } from "@/components/JoinClient";

/**
 * Server Component for Join Page
 * Handles generateStaticParams and Next.js 15 Async Params requirements.
 * Renders the Client-side JoinClient component.
 */

export function generateStaticParams() {
  return [{ hostId: 'simulate_host' }];
}

export default async function JoinRedirectPage({ params }: { params: Promise<{ hostId: string }> }) {
  const resolvedParams = await params;
  const hostId = resolvedParams.hostId;

  return <JoinClient hostId={hostId} />;
}