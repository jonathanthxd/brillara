"use client";

import { useEffect } from "react";

type ReferralSource = "query" | "hash";

interface ParsedReferral {
  code: string;
  source: ReferralSource;
}

function parseReferralFromUrl(): ParsedReferral | null {
  const url = new URL(window.location.href);
  const queryCode = url.searchParams.get("ref");
  if (queryCode) return { code: queryCode, source: "query" };

  const fragment = url.hash.slice(1);
  if (!fragment) return null;

  // Backwards compatibility for the requested #10001 format. A raw text
  // fragment such as #precio is intentionally not treated as a referral.
  if (/^\d{3,32}$/.test(fragment)) return { code: fragment, source: "hash" };
  if (fragment.startsWith("ref=")) return { code: fragment.slice(4), source: "hash" };

  return null;
}

function removeReferralFromUrl(source: ReferralSource): void {
  const url = new URL(window.location.href);
  if (source === "query") url.searchParams.delete("ref");
  else url.hash = "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/** Captures legacy #10001 and ?ref=10001 links after the page loads. */
export function ReferralCapture() {
  useEffect(() => {
    const referral = parseReferralFromUrl();
    if (!referral) return;

    void fetch("/api/referrals/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        code: referral.code,
        source: referral.source,
        landingPath: window.location.pathname,
      }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json() as { handled?: boolean };
        if (result.handled) removeReferralFromUrl(referral.source);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
