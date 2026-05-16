import z from "zod";
import type { DbService } from "../sql/DbService.js";
import type { Action } from "./Identity.js";

const roleRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  is_system: z.boolean(),
  created_at: z.date(),
});

const policyRowSchema = z.object({
  action: z.string(),
});

const configRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type Role = {
  id: string;
  name: string;
  description: string | undefined;
  isSystem: boolean;
  createdAt: Date;
};

const toRole = (row: z.infer<typeof roleRowSchema>): Role => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  isSystem: row.is_system,
  createdAt: row.created_at,
});

export class RoleRepository {
  constructor(private readonly db: DbService) {}

  async findAll(): Promise<Role[]> {
    const rows = await this.db.any(
      roleRowSchema,
      "SELECT id, name, description, is_system, created_at FROM roles ORDER BY name",
    );
    return rows.map(toRole);
  }

  async findById(id: string): Promise<Role | undefined> {
    const row = await this.db.oneOrNone(
      roleRowSchema,
      "SELECT id, name, description, is_system, created_at FROM roles WHERE id = $1",
      [id],
    );
    return row ? toRole(row) : undefined;
  }

  async findByName(name: string): Promise<Role | undefined> {
    const row = await this.db.oneOrNone(
      roleRowSchema,
      "SELECT id, name, description, is_system, created_at FROM roles WHERE name = $1",
      [name],
    );
    return row ? toRole(row) : undefined;
  }

  async getPolicies(roleId: string): Promise<Action[]> {
    const rows = await this.db.any(
      policyRowSchema,
      "SELECT action FROM role_policies WHERE role_id = $1",
      [roleId],
    );
    return rows.map((r) => r.action as Action);
  }

  async getPoliciesForRoles(roleIds: string[]): Promise<Action[]> {
    if (roleIds.length === 0) return [];
    const rows = await this.db.any(
      policyRowSchema,
      "SELECT DISTINCT action FROM role_policies WHERE role_id = ANY($1::uuid[])",
      [roleIds],
    );
    return rows.map((r) => r.action as Action);
  }

  async create(name: string, description: string | undefined): Promise<Role> {
    const row = await this.db.one(
      roleRowSchema,
      "INSERT INTO roles (name, description, is_system) VALUES ($1, $2, false) RETURNING id, name, description, is_system, created_at",
      [name, description ?? null],
    );
    return toRole(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.none(
      "DELETE FROM roles WHERE id = $1 AND is_system = false",
      [id],
    );
  }

  async addPolicy(roleId: string, action: Action): Promise<void> {
    await this.db.none(
      "INSERT INTO role_policies (role_id, action) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [roleId, action],
    );
  }

  async removePolicy(roleId: string, action: Action): Promise<void> {
    await this.db.none(
      "DELETE FROM role_policies WHERE role_id = $1 AND action = $2",
      [roleId, action],
    );
  }

  async getConfig(key: string): Promise<string | undefined> {
    const row = await this.db.oneOrNone(
      configRowSchema,
      "SELECT key, value FROM idp_config WHERE key = $1",
      [key],
    );
    return row?.value;
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.db.none(
      "INSERT INTO idp_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, value],
    );
  }
}
