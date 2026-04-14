'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analytics: any;
  }
}

interface SegmentAnalyticsProps {
  writeKey: string;
}

export function SegmentAnalytics({ writeKey }: SegmentAnalyticsProps) {
  useEffect(() => {
    if (!writeKey) return;

    // Segment snippet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analytics = (window.analytics = window.analytics || ([] as any));
    if (analytics.initialize) return;
    if (analytics.invoked) return;

    analytics.invoked = true;
    analytics.methods = [
      'trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview',
      'identify', 'reset', 'group', 'track', 'ready', 'alias', 'debug',
      'page', 'once', 'off', 'on', 'addSourceMiddleware', 'addIntegrationMiddleware',
      'setAnonymousId', 'addDestinationMiddleware',
    ];
    analytics.factory = function (method: string) {
      return function (...args: unknown[]) {
        args.unshift(method);
        analytics.push(args);
        return analytics;
      };
    };
    for (const method of analytics.methods) {
      analytics[method] = analytics.factory(method);
    }
    analytics.load = function (key: string, options?: unknown) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://cdn.segment.com/analytics.js/v1/${key}/analytics.min.js`;
      document.head.appendChild(script);
      analytics._loadOptions = options;
    };
    analytics.SNIPPET_VERSION = '4.15.3';
    analytics.load(writeKey);
    analytics.page();
  }, [writeKey]);

  return null;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, properties);
  }
}

export function trackPage(name?: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.page(name, properties);
  }
}
