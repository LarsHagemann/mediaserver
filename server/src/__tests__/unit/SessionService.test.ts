import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionService } from "../../auth/SessionService.js";
import type { SessionRepository } from "../../auth/SessionRepository.js";
import type { UserRepository } from "../../auth/UserRepository.js";
import type { RoleRepository } from "../../auth/RoleRepository.js";
import type { RedisClient } from "../../redis/RedisClient.js";
import type { EnvironmentService } from "../../common/EnvironmentService.js";
import type { PermissionVersionService } from "../../auth/PermissionVersionService.js";

const SESSION_ID = "session-1";
const USER_ID = "user-1";

describe("SessionService permission-version invalidation", () => {
  let sessionRepository: SessionRepository;
  let userRepository: UserRepository;
  let roleRepository: RoleRepository;
  let redis: RedisClient;
  let envService: EnvironmentService;
  let permissionVersion: PermissionVersionService;
  let service: SessionService;

  let currentVersion: number;

  beforeEach(() => {
    currentVersion = 5;

    sessionRepository = {
      findById: vi.fn().mockResolvedValue({
        userId: USER_ID,
        expiresAt: new Date(Date.now() + 3_600_000),
      }),
    } as unknown as SessionRepository;

    userRepository = {
      getRoleIds: vi.fn().mockResolvedValue(["role-1"]),
    } as unknown as UserRepository;

    roleRepository = {
      getPoliciesForRoles: vi.fn().mockResolvedValue(["document:read"]),
      getPolicies: vi.fn().mockResolvedValue([]),
      getConfig: vi.fn().mockResolvedValue(undefined),
    } as unknown as RoleRepository;

    redis = {
      get: vi.fn(),
      setWithTtl: vi.fn().mockResolvedValue(undefined),
    } as unknown as RedisClient;

    envService = { sessionTtlSeconds: 3600 } as unknown as EnvironmentService;

    permissionVersion = {
      getVersion: vi.fn().mockImplementation(async () => currentVersion),
      bump: vi.fn(),
    } as unknown as PermissionVersionService;

    service = new SessionService(
      sessionRepository,
      userRepository,
      roleRepository,
      redis,
      envService,
      permissionVersion,
    );
  });

  it("uses the cached session when its permission version is current", async () => {
    vi.mocked(redis.get).mockResolvedValue(
      JSON.stringify({
        userId: USER_ID,
        permissions: ["tag:manage"],
        permVersion: 5,
      }),
    );

    const identity = await service.resolveIdentity(SESSION_ID);

    expect(identity.permissions).toEqual(["tag:manage"]);
    // No DB lookup needed on a fresh cache hit.
    expect(sessionRepository.findById).not.toHaveBeenCalled();
  });

  it("recomputes permissions from the DB when the cached version is stale", async () => {
    // Cached at version 4, but a privilege change bumped current to 5.
    vi.mocked(redis.get).mockResolvedValue(
      JSON.stringify({
        userId: USER_ID,
        permissions: ["admin:users"],
        permVersion: 4,
      }),
    );

    const identity = await service.resolveIdentity(SESSION_ID);

    // The stale "admin:users" must not be honored; fresh DB permissions win.
    expect(identity.permissions).toEqual(["document:read"]);
    expect(sessionRepository.findById).toHaveBeenCalledWith(SESSION_ID);
    // Re-cached with the current version.
    expect(redis.setWithTtl).toHaveBeenCalledWith(
      expect.stringContaining(SESSION_ID),
      expect.stringContaining('"permVersion":5'),
      expect.any(Number),
    );
  });

  it("recomputes anonymous permissions when the cached version is stale", async () => {
    vi.mocked(redis.get).mockResolvedValue(
      JSON.stringify({ permissions: ["document:read"], permVersion: 4 }),
    );
    vi.mocked(roleRepository.getConfig).mockResolvedValue("anon-role");
    vi.mocked(roleRepository.getPolicies).mockResolvedValue([]);

    const identity = await service.resolveAnonymousIdentity();

    expect(identity.permissions).toEqual([]);
    expect(roleRepository.getConfig).toHaveBeenCalledWith("anonymous_role_id");
  });
});
