import { Router } from "express";
import { apiHandler } from "../ApiHandler.js";
import { DI_CONTAINER } from "../DiContainer.js";
import { services, repositories } from "../DefaultDiContainer.js";
import type { OAuthService } from "../auth/OAuthService.js";
import type { SessionService } from "../auth/SessionService.js";
import type { UserService } from "../auth/UserService.js";
import type { RoleRepository } from "../auth/RoleRepository.js";
import type { SessionRepository } from "../auth/SessionRepository.js";
import type { EnvironmentService } from "../common/EnvironmentService.js";
import { ALL_ACTIONS } from "../auth/Identity.js";
import { ApiError } from "../common/ApiError.js";
import { parseUserAgent } from "../auth/parseUserAgent.js";

export const authRouter = Router();

authRouter.get(
  "/me",
  apiHandler(async ({ identity, diContainer }) => {
    let name: string | null = null;
    let email: string | null = null;

    if (identity.isAuthenticated && identity.userId && identity.userId !== "system") {
      const userService = diContainer.get<UserService>(services.userService);
      try {
        const user = await userService.getUser(identity.userId);
        name = user.name ?? null;
        email = user.email ?? null;
      } catch {
        // user not found
      }
    }

    const envService = diContainer.get<EnvironmentService>(services.environment);

    return {
      status: 200,
      body: {
        userId: identity.userId,
        isAuthenticated: identity.isAuthenticated,
        permissions: identity.permissions,
        name,
        email,
        registrationAllowed: envService.idpEnabled && envService.idpRegistrationAllowed,
      },
    };
  }),
);

authRouter.get(
  "/actions",
  apiHandler(async () => {
    return { status: 200, body: { actions: ALL_ACTIONS } };
  }),
);

authRouter.get(
  "/sessions",
  apiHandler(async ({ identity, diContainer, headers }) => {
    if (!identity.isAuthenticated || !identity.userId) {
      throw new ApiError("Unauthorized", 401, "Not authenticated");
    }

    const cookieHeader = headers.cookie ?? "";
    const currentSessionId = cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .find(([k]) => k === "session_id")?.[1];

    const sessionRepository = diContainer.get<SessionRepository>(repositories.session);
    const sessions = await sessionRepository.findByUserId(identity.userId);

    return {
      status: 200,
      body: {
        sessions: sessions.map((s) => ({
          id: s.id,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          isCurrent: s.id === currentSessionId,
          ...parseUserAgent(s.userAgent),
        })),
      },
    };
  }),
);

authRouter.delete(
  "/sessions/:id",
  apiHandler(async ({ identity, diContainer, params }) => {
    if (!identity.isAuthenticated || !identity.userId) {
      throw new ApiError("Unauthorized", 401, "Not authenticated");
    }

    const sessionId = params["id"];
    if (!sessionId) throw new ApiError("BadRequest", 400, "Missing session id");

    const sessionRepository = diContainer.get<SessionRepository>(repositories.session);
    const session = await sessionRepository.findById(sessionId);

    if (!session || session.userId !== identity.userId) {
      throw new ApiError("NotFound", 404, "Session not found");
    }

    const sessionService = diContainer.get<SessionService>(services.sessionService);
    await sessionService.deleteSession(sessionId);

    return { status: 204, body: {} };
  }),
);

authRouter.get("/register", async (_req, res) => {
  const envService = DI_CONTAINER.get<EnvironmentService>(services.environment);
  if (!envService.idpEnabled || !envService.idpRegistrationAllowed) {
    res.status(404).json({ message: "Registration not enabled" });
    return;
  }

  const oauthService = DI_CONTAINER.get<OAuthService>(services.oauthService);
  const url = await oauthService.getRegistrationUrl();
  res.redirect(url);
});

authRouter.get("/login", async (_req, res) => {
  const envService = DI_CONTAINER.get<EnvironmentService>(services.environment);
  if (!envService.idpEnabled) {
    res.status(404).json({ message: "IdP not enabled" });
    return;
  }

  const oauthService = DI_CONTAINER.get<OAuthService>(services.oauthService);
  const { url } = await oauthService.getAuthorizationUrl();
  res.redirect(url);
});

authRouter.get("/callback", async (req, res) => {
  const envService = DI_CONTAINER.get<EnvironmentService>(services.environment);
  if (!envService.idpEnabled) {
    res.status(404).json({ message: "IdP not enabled" });
    return;
  }

  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;

  if (!code || !state) {
    res.status(400).json({ message: "Missing code or state" });
    return;
  }

  try {
    const oauthService = DI_CONTAINER.get<OAuthService>(services.oauthService);
    const sessionService = DI_CONTAINER.get<SessionService>(services.sessionService);
    const userService = DI_CONTAINER.get<UserService>(services.userService);
    const roleRepository = DI_CONTAINER.get<RoleRepository>(repositories.role);

    const userInfo = await oauthService.handleCallback(code, state);
    const [defaultRoleId, adminRole] = await Promise.all([
      roleRepository.getConfig("default_role_id"),
      roleRepository.findByName("admin"),
    ]);

    const user = await userService.loginOrRegister({
      externalId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      adminUserIds: envService.idpAdminUserIds,
      defaultRoleId,
      adminRole,
    });

    const userAgent = req.headers["user-agent"] ?? null;
    const sessionId = await sessionService.createSession(user.id, userAgent);
    const ttl = envService.sessionTtlSeconds;

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: envService.stage === "production",
      maxAge: ttl * 1000,
    });

    res.redirect(envService.idpFrontendUrl);
  } catch (err) {
    console.error("OAuth callback error", err);
    res.status(400).json({ message: "Authentication failed" });
  }
});

authRouter.get("/logout", async (req, res) => {
  const envService = DI_CONTAINER.get<EnvironmentService>(services.environment);
  const sessionId = req.cookies?.session_id as string | undefined;

  if (sessionId && envService.idpEnabled) {
    const sessionService = DI_CONTAINER.get<SessionService>(services.sessionService);
    await sessionService.deleteSession(sessionId);
  }

  res.clearCookie("session_id");

  if (envService.idpEnabled) {
    const oauthService = DI_CONTAINER.get<OAuthService>(services.oauthService);
    const logoutUrl = await oauthService.getLogoutUrl();
    res.redirect(logoutUrl);
  } else {
    res.redirect(envService.idpFrontendUrl);
  }
});
