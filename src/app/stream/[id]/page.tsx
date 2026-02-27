
'use client';

import { StreamClient } from "@/components/Stream/StreamClient";
import { useParams } from "next/navigation";

/**
 * Dynamic Stream Page
 * Logic is moved to StreamClient to prevent hydration and ReferenceErrors.
 */
export default function StreamHostPage() {
  const params = useParams();
  const id = params?.id as string || 'simulate_host';

  return <StreamClient id={id} />;
}
