import type { RequestHandler } from "express";

/**
 * Sets a baseline of security-relevant response headers. Kept dependency-free
 * (i.e. without `helmet`) since the API serves JSON and media rather than HTML.
 */
export const securityHeaders = (): RequestHandler => {
  return (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    next();
  };
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

/**
 * Minimal in-memory fixed-window rate limiter, keyed by client IP. Intended for
 * low-frequency, abuse-prone endpoints (auth redirects/callbacks). For a
 * multi-instance deployment this should be replaced with a shared store.
 */
export const rateLimit = ({
  windowMs,
  max,
}: RateLimitOptions): RequestHandler => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";

    // Opportunistic cleanup of expired entries to bound memory usage.
    if (hits.size > 10000) {
      for (const [k, v] of hits) {
        if (v.resetAt <= now) hits.delete(k);
      }
    }

    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.status(429).json({
        name: "TooManyRequests",
        status: 429,
        message: "Too many requests, please try again later",
      });
      return;
    }

    entry.count += 1;
    next();
  };
};
