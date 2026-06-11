'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/tracking';

/**
 * Runs once on every client page load. Applies the first-touch rule and
 * stores the attribution in localStorage so the /form page can read it
 * back at submit time.
 *
 * Rendered into the root layout so it fires on every route — landing,
 * /form, /services, etc.
 */
export default function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
