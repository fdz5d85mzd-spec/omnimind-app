'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  useEffect(() => {
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('ogn_session_id') || '';
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        sessionStorage.setItem('ogn_session_id', sessionId);
      }
    } catch (_) {
      sessionId = 'sess_fallback_' + Date.now();
    }

    const refCode = searchParams?.get('ref') || null;
    if (refCode) {
      try {
        localStorage.setItem('ogn_ref_code', refCode);
      } catch (_) {}
    }

    const storedRefCode = refCode || (typeof window !== 'undefined' ? localStorage.getItem('ogn_ref_code') : null);

    const fullUrl = window.location.href;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: fullUrl,
        sessionId,
        type: 'pageview',
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        refCode: storedRefCode,
      }),
    }).catch((err) => console.error('[AnalyticsTracker] Track error:', err));
  }, [pathname, searchParams]);

  return null;
}
