import type { RedisClient } from "../redis/RedisClient.js";

const PERMISSIONS_VERSION_KEY = "auth:permissions_version";

/**
 * Tracks a monotonically increasing "permissions version" in Redis.
 *
 * Cached sessions (and the anonymous-permissions cache) store the version that
 * was current when their permissions were computed. Whenever a permission-
 * affecting change is made in the database (role policies, user role
 * assignments, role deletion, anonymous/default role config) the version is
 * bumped via {@link bump}. On the next request, a cached session whose stored
 * version no longer matches the current version is recomputed from the database
 * instead of being trusted, so privilege changes — in particular revocations —
 * take effect immediately rather than only when the session cache expires.
 */
export class PermissionVersionService {
  constructor(private readonly redis: RedisClient) {}

  async getVersion(): Promise<number> {
    const raw = await this.redis.get(PERMISSIONS_VERSION_KEY);
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async bump(): Promise<void> {
    await this.redis.incr(PERMISSIONS_VERSION_KEY);
  }
}
