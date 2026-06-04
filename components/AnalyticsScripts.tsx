"use client";

import Script from "next/script";
import posthog from "posthog-js";
import { useEffect } from "react";

export function AnalyticsScripts() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

  useEffect(() => {
    if (!posthogKey) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      persistence: "localStorage+cookie",
      person_profiles: "identified_only"
    });
  }, [posthogHost, posthogKey]);

  return plausibleDomain ? (
    <Script
      data-domain={plausibleDomain}
      defer
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  ) : null;
}
