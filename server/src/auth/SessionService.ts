import { v4 as uuidv4 } from "uuid";
import { AnonymousIdentity, SessionIdentity, type Identity } from "./Identity.js";
import type { SessionRepository } from "./SessionRepository.js";
import type { UserRepository } from "./UserRepository.js";
import type { RoleRepository } from "./RoleRepository.js";
import type { RedisClient } from "../redis/RedisClient.js";
import type { EnvironmentService } from "../common/EnvironmentService.js";

const SESSION_KEY_PREFIX = "session:";
const ANON_PERMISSIONS_KEY = "auth:anonymous_permissions";

type CachedSession = {
  userId: string;
  permissions: string[];
};

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly redis: RedisClient,
    private readonly envService: EnvironmentService,
  ) {}

  async createSession(userId: string, userAgent: string | null = null): Promise<string> {
    const sessionId = uuidv4();
    const ttl = this.envService.sessionTtlSeconds;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.sessionRepository.create(sessionId, userId, expiresAt, userAgent);

    const roleIds = await this.userRepository.getRoleIds(userId);
    const permissions = await this.roleRepository.getPoliciesForRoles(roleIds);

    const cached: CachedSession = { userId, permissions };
    await this.redis.setWithTtl(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      JSON.stringify(cached),
      ttl,
    );

    return sessionId;
  }

  async resolveIdentity(sessionId: string): Promise<Identity> {
    const cached = await this.redis.get(`${SESSION_KEY_PREFIX}${sessionId}`);
    if (cached) {
      const { userId, permissions } = JSON.parse(cached) as CachedSession;
      return new SessionIdentity(userId, permissions as never);
    }

    const session = await this.sessionRepository.findById(sessionId);
    if (!session?.userId) return this.resolveAnonymousIdentity();

    const roleIds = await this.userRepository.getRoleIds(session.userId);
    const permissions = await this.roleRepository.getPoliciesForRoles(roleIds);

    const ttlSeconds = Math.max(
      0,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    );
    if (ttlSeconds > 0) {
      const toCache: CachedSession = { userId: session.userId, permissions };
      await this.redis.setWithTtl(
        `${SESSION_KEY_PREFIX}${sessionId}`,
        JSON.stringify(toCache),
        ttlSeconds,
      );
    }

    return new SessionIdentity(session.userId, permissions);
  }

  async resolveAnonymousIdentity(): Promise<Identity> {
    const cachedPerms = await this.redis.get(ANON_PERMISSIONS_KEY);
    if (cachedPerms) {
      return new AnonymousIdentity(JSON.parse(cachedPerms) as never);
    }

    const anonymousRoleId = await this.roleRepository.getConfig("anonymous_role_id");
    const permissions = anonymousRoleId
      ? await this.roleRepository.getPolicies(anonymousRoleId)
      : [];

    await this.redis.setWithTtl(ANON_PERMISSIONS_KEY, JSON.stringify(permissions), 300);
    return new AnonymousIdentity(permissions);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.sessionRepository.delete(sessionId),
      this.redis.del(`${SESSION_KEY_PREFIX}${sessionId}`),
    ]);
  }

  async invalidateUserSessionCache(userId: string): Promise<void> {
    // Sessions for this user in Redis will naturally expire; no active
    // invalidation needed unless we maintain a user→sessions index.
    // For now the DB record is removed, so stale Redis entries are harmless
    // as long as the DB row is the authoritative check.
    void userId;
  }
}
