import { StreamClient } from "@/components/Stream/StreamClient";

/**
 * Server Component for Stream Page
 * Handles generateStaticParams and Next.js 15 Async Params requirements.
 * Renders the Client-side StreamClient component.
 */

export function generateStaticParams() {
  return [{ id: 'simulate_host' }];
}

export default async function StreamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <StreamClient id={id} />;
}
