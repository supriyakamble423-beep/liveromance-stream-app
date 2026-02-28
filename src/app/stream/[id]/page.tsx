import StreamClient from "@/components/Stream/StreamClient";

/**
 * Dynamic Stream Page (Server Component)
 * Handling params as a Promise for Next.js 15 compatibility.
 */
export default async function StreamHostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || 'simulate_host';

  return <StreamClient id={id} />;
}

export async function generateStaticParams() {
  return [
    { id: 'simulate_host' },
  ];
}
