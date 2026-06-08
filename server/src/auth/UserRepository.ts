import z from "zod";
import type { DbService } from "../sql/DbService.js";

const userRowSchema = z.object({
  id: z.string(),
  external_id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  created_at: z.date(),
});

const roleIdRowSchema = z.object({
  role_id: z.string(),
});

export type User = {
  id: string;
  externalId: string;
  email: string | undefined;
  name: string | undefined;
  createdAt: Date;
};

const toUser = (row: z.infer<typeof userRowSchema>): User => ({
  id: row.id,
  externalId: row.external_id,
  email: row.email ?? undefined,
  name: row.name ?? undefined,
  createdAt: row.created_at,
});

export class UserRepository {
  constructor(private readonly db: DbService) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db.any(
      userRowSchema,
      "SELECT id, external_id, email, name, created_at FROM users ORDER BY created_at",
    );
    return rows.map(toUser);
  }

  async findById(id: string): Promise<User | undefined> {
    const row = await this.db.oneOrNone(
      userRowSchema,
      "SELECT id, external_id, email, name, created_at FROM users WHERE id = $1",
      [id],
    );
    return row ? toUser(row) : undefined;
  }

  async findByExternalId(externalId: string): Promise<User | undefined> {
    const row = await this.db.oneOrNone(
      userRowSchema,
      "SELECT id, external_id, email, name, created_at FROM users WHERE external_id = $1",
      [externalId],
    );
    return row ? toUser(row) : undefined;
  }

  async upsert(
    externalId: string,
    email: string | undefined,
    name: string | undefined,
  ): Promise<User> {
    const row = await this.db.one(
      userRowSchema,
      `INSERT INTO users (external_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (external_id) DO UPDATE
         SET email = EXCLUDED.email,
             name  = EXCLUDED.name
       RETURNING id, external_id, email, name, created_at`,
      [externalId, email ?? null, name ?? null],
    );
    return toUser(row);
  }

  async getRoleIds(userId: string): Promise<string[]> {
    const rows = await this.db.any(
      roleIdRowSchema,
      "SELECT role_id FROM user_roles WHERE user_id = $1",
      [userId],
    );
    return rows.map((r) => r.role_id);
  }

  async hasAnyRoles(userId: string): Promise<boolean> {
    const rows = await this.db.any(
      roleIdRowSchema,
      "SELECT role_id FROM user_roles WHERE user_id = $1 LIMIT 1",
      [userId],
    );
    return rows.length > 0;
  }

  async addRole(userId: string, roleId: string): Promise<void> {
    await this.db.none(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, roleId],
    );
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.db.none(
      "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2",
      [userId, roleId],
    );
  }

  async setRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.db.transaction(async () => {
      await this.db.none("DELETE FROM user_roles WHERE user_id = $1", [userId]);
      for (const roleId of roleIds) {
        await this.db.none(
          "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
          [userId, roleId],
        );
      }
    });
  }
}
