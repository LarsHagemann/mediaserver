import type { RequestHandler } from "express";
import { AllowAllIdentity } from "./Identity.js";
import type { Identity } from "./Identity.js";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import type { SessionService } from "./SessionService.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      identity: Identity;
    }
  }
}

export const createSessionMiddleware = (
  envService: EnvironmentService,
  sessionService: SessionService,
): RequestHandler => {
  return async (req, _res, next) => {
    if (!envService.idpEnabled) {
      req.identity = new AllowAllIdentity();
      return next();
    }

    try {
      const sessionId = req.cookies?.session_id as string | undefined;
      if (sessionId) {
        req.identity = await sessionService.resolveIdentity(sessionId);
      } else {
        req.identity = await sessionService.resolveAnonymousIdentity();
      }
    } catch {
      req.identity = await sessionService.resolveAnonymousIdentity();
    }

    next();
  };
};
