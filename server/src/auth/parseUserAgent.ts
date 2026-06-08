import Bowser from "bowser";

export type ParsedUserAgent = {
  browser: string | null;
  os: string | null;
  platform: string | null;
};

export const parseUserAgent = (ua: string | null): ParsedUserAgent => {
  if (!ua) return { browser: null, os: null, platform: null };

  try {
    const result = Bowser.parse(ua);
    return {
      browser: result.browser?.name ?? null,
      os: result.os?.name ?? null,
      platform: result.platform?.type ?? null,
    };
  } catch {
    return { browser: null, os: null, platform: null };
  }
};
