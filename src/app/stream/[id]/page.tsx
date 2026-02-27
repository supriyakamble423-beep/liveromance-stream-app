// src/app/stream/[id]/page.tsx
// यह Server Component है - 'use client' नहीं लगाना

import { StreamClient } from "@/components/Stream/StreamClient";

/**
 * Dynamic Stream Page (Server Component)
 * Logic is moved to StreamClient (client component) to avoid hydration and ReferenceErrors.
 */
export default function StreamHostPage({ params }: { params: { id: string } }) {
  const id = params?.id || 'simulate_host';

  return <StreamClient id={id} />;
}

// Static export के लिए जरूरी - dynamic [id] pre-generate करो
export async function generateStaticParams() {
  return [
    { id: 'simulate_host' }, // तुम्हारा simulate page
    // अगर real host IDs चाहिए तो यहां add करो (build time पर)
    // { id: 'host-123' },
    // { id: 'host-456' },
  ];
}