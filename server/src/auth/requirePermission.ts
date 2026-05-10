// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { RequestHandler } from "express";
import type { Action } from "./Identity.js";

// Typed as any-params so TypeScript doesn't try to unify this middleware's
// generic types with the specific types of the apiHandler that follows it.
export const requirePermission = (action: Action): RequestHandler<any, any, any, any> => {
  return (req, res, next) => {
    if (!req.identity) {
      res.status(401).json({ name: "Unauthorized", status: 401, message: "Not authenticated" });
      return;
    }
    if (!req.identity.hasPermission(action)) {
      res.status(403).json({ name: "Forbidden", status: 403, message: `Missing permission: ${action}` });
      return;
    }
    next();
  };
};
