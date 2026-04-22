export interface ClientFingerprint {
  device: string;
  browser: string;
  language: string;
  platform: string;
  timezone: string;
  timestamp: string;
  user_agent: string;
  screen_resolution: string;
}

interface UserAgentDataLike {
  platform?: string;
  mobile?: boolean;
  brands?: { brand: string; version: string }[];
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: UserAgentDataLike;
}

function parseBrowser(ua: string): string {
  const tests: Array<[RegExp, string]> = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  for (const [re, name] of tests) {
    const m = ua.match(re);
    if (m) return `${name} ${m[1]}`;
  }
  return 'Unknown';
}

function parseDevice(ua: string, mobileHint?: boolean): string {
  if (/iPhone/.test(ua)) {
    const m = ua.match(/iPhone OS ([\d_]+)/);
    return m ? `iPhone iOS ${m[1].replace(/_/g, '.')}` : 'iPhone';
  }
  if (/iPad/.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/);
    return m ? `iPad iPadOS ${m[1].replace(/_/g, '.')}` : 'iPad';
  }
  if (/Android/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    const kind = /Mobile/.test(ua) ? 'Mobile' : 'Tablet';
    return m ? `Android ${m[1]} ${kind}` : `Android ${kind}`;
  }
  if (/Windows NT 10\.0/.test(ua)) return 'Windows 10 Desktop';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1 Desktop';
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8 Desktop';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7 Desktop';
  if (/Windows/.test(ua)) return 'Windows Desktop';
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    return m ? `macOS ${m[1].replace(/_/g, '.')} Desktop` : 'macOS Desktop';
  }
  if (/Linux/.test(ua)) return 'Linux Desktop';
  return mobileHint ? 'Mobile' : 'Desktop';
}

export function collectClientFingerprint(): ClientFingerprint {
  const nav = navigator as NavigatorWithUAData;
  const ua = nav.userAgent || '';
  const uaData = nav.userAgentData;

  const platform =
    uaData?.platform ||
    (nav as unknown as { platform?: string }).platform ||
    '';

  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    timezone = '';
  }

  const screenRes =
    typeof screen !== 'undefined'
      ? `${screen.width}x${screen.height}`
      : '';

  return {
    device: parseDevice(ua, uaData?.mobile),
    browser: parseBrowser(ua),
    language: nav.language || '',
    platform,
    timezone,
    timestamp: new Date().toISOString(),
    user_agent: ua,
    screen_resolution: screenRes,
  };
}
