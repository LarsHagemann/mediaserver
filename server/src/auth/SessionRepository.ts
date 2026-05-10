import z from "zod";
import type { DbService } from "../sql/DbService.js";

const sessionRowSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  created_at: z.date(),
  expires_at: z.date(),
  user_agent: z.string().nullable(),
});

export type Session = {
  id: string;
  userId: string | undefined;
  createdAt: Date;
  expiresAt: Date;
  userAgent: string | null;
};

const toSession = (row: z.infer<typeof sessionRowSchema>): Session => ({
  id: row.id,
  userId: row.user_id ?? undefined,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  userAgent: row.user_agent,
});

export class SessionRepository {
  constructor(private readonly db: DbService) {}

  async create(id: string, userId: string, expiresAt: Date, userAgent: string | null): Promise<Session> {
    const row = await this.db.one(
      sessionRowSchema,
      "INSERT INTO sessions (id, user_id, expires_at, user_agent) VALUES ($1, $2, $3, $4) RETURNING id, user_id, created_at, expires_at, user_agent",
      [id, userId, expiresAt, userAgent],
    );
    return toSession(row);
  }

  async findById(id: string): Promise<Session | undefined> {
    const row = await this.db.oneOrNone(
      sessionRowSchema,
      "SELECT id, user_id, created_at, expires_at, user_agent FROM sessions WHERE id = $1 AND expires_at > now()",
      [id],
    );
    return row ? toSession(row) : undefined;
  }

  async delete(id: string): Promise<void> {
    await this.db.none("DELETE FROM sessions WHERE id = $1", [id]);
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db.any(
      sessionRowSchema,
      "SELECT id, user_id, created_at, expires_at, user_agent FROM sessions WHERE user_id = $1 AND expires_at > now() ORDER BY created_at DESC",
      [userId],
    );
    return rows.map(toSession);
  }

  async deleteExpired(): Promise<void> {
    await this.db.none("DELETE FROM sessions WHERE expires_at <= now()");
  }
}
