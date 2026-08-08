"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Belt-and-suspenders periodic refresh, in case the socket connection drops
 * (important for a TV panel expected to stay accurate unattended). */
export function AutoRefreshInterval({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
