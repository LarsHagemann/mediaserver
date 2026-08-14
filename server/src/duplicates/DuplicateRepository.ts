import z from "zod";
import type { DbService } from "../sql/DbService.js";
import type { ApiTag } from "../tags/TagRepository.js";
import type { DocumentAccessScope } from "../auth/AccessScope.js";
import {
  buildScopeHaving,
  buildScopeParams,
} from "../documents/DocumentRepository.js";
import {
  paginated,
  toPaginatedResponse,
  type PaginatedResponse,
} from "../util/PaginatedResponse.js";

export type ListDuplicateGroupsRequest = {
  limit: number;
  offset: number;
  scope: DocumentAccessScope;
};

export type DuplicateGroupMember = {
  id: string;
  mime: string;
  friendlyName: string;
  ownerId: string;
  ownerName: string | undefined;
  isPublic: boolean;
  sizeBytes: number;
  createdAt: Date;
  tags: ApiTag[];
};

export type DuplicateGroup = {
  contentHash: string;
  documentCount: number;
  /** Size of a single copy; every member of a group is byte-identical. */
  sizeBytes: number;
  /** Disk freed by collapsing the group to one document. */
  reclaimableBytes: number;
  documents: DuplicateGroupMember[];
};

const groupRowSchema = z.object({
  content_hash: z.string(),
  document_count: z.coerce.number().int(),
  size_bytes: z.coerce.number().int(),
  reclaimable_bytes: z.coerce.number().int(),
});

const memberRowSchema = z.object({
  id: z.string(),
  mime: z.string(),
  friendly_name: z.string(),
  owner_id: z.string(),
  owner_name: z.string().nullable(),
  is_public: z.boolean(),
  content_hash: z.string(),
  size_bytes: z.coerce.number().int(),
  created_at: z.date(),
  key: z.string().nullable(),
  value: z.string().nullable(),
  type: z.string().nullable(),
});

const pathRowSchema = z.object({
  id: z.string(),
  base_path: z.string(),
  filename: z.string(),
});

export type DocumentFileLocation = z.infer<typeof pathRowSchema>;

export class DuplicateRepository {
  constructor(private readonly dbService: DbService) {}

  /**
   * Groups documents by content hash, returning one page of groups that hold
   * more than one document. Ordered by reclaimable space so the groups worth
   * the user's attention come first.
   */
  public async listDuplicateGroups({
    limit,
    offset,
    scope,
  }: ListDuplicateGroupsRequest): Promise<PaginatedResponse<DuplicateGroup>> {
    if (scope.type === "none") {
      return { items: [], total: 0 };
    }

    const scopeClause = buildScopeHaving(scope, "d");
    const scopeParams = buildScopeParams(scope);

    const groups = await this.dbService.any(
      paginated(groupRowSchema),
      `WITH duplicate_groups AS (
         SELECT
           d.content_hash,
           COUNT(*) AS document_count,
           COALESCE(MAX(d.size_bytes), 0) AS size_bytes,
           COALESCE(MAX(d.size_bytes), 0) * (COUNT(*) - 1) AS reclaimable_bytes
         FROM documents d
         WHERE d.content_hash IS NOT NULL${scopeClause}
         GROUP BY d.content_hash
         HAVING COUNT(*) > 1
       )
       SELECT
         content_hash,
         document_count,
         size_bytes,
         reclaimable_bytes,
         (COUNT(*) OVER ())::int AS __total
       FROM duplicate_groups
       ORDER BY reclaimable_bytes DESC, content_hash
       LIMIT $limit OFFSET $offset`,
      { ...scopeParams, limit, offset },
    );

    const page = toPaginatedResponse(groups);
    const members = await this.listGroupMembers(
      page.items.map((group) => group.content_hash),
      scope,
    );

    return {
      total: page.total,
      items: page.items.map((group) => ({
        contentHash: group.content_hash,
        documentCount: group.document_count,
        sizeBytes: group.size_bytes,
        reclaimableBytes: group.reclaimable_bytes,
        documents: members.get(group.content_hash) ?? [],
      })),
    };
  }

  /**
   * Loads the documents belonging to the given hashes, with their tags, as a
   * map keyed by content hash. Applying the same scope as the grouping query
   * keeps a group from ever listing a document the caller may not act on.
   */
  public async listGroupMembers(
    contentHashes: string[],
    scope: DocumentAccessScope,
  ): Promise<Map<string, DuplicateGroupMember[]>> {
    if (contentHashes.length === 0 || scope.type === "none") {
      return new Map();
    }

    const rows = await this.dbService.any(
      memberRowSchema,
      `SELECT
         d.id,
         d.mime,
         d.friendly_name,
         d.owner_id,
         u.name AS owner_name,
         d.is_public,
         d.content_hash,
         COALESCE(d.size_bytes, 0) AS size_bytes,
         d.created_at,
         t.key,
         t.value,
         t.type
       FROM documents d
       JOIN users u ON u.id = d.owner_id
       LEFT JOIN userdata_tags ut ON ut.userdata_id = d.id
       LEFT JOIN tags t ON t.id = ut.tag_id
       WHERE d.content_hash = ANY($contentHashes)${buildScopeHaving(scope, "d")}
       ORDER BY d.created_at ASC, d.id`,
      { ...buildScopeParams(scope), contentHashes },
    );

    const byHash = new Map<string, DuplicateGroupMember[]>();
    const byId = new Map<string, DuplicateGroupMember>();

    for (const row of rows) {
      let member = byId.get(row.id);
      if (!member) {
        member = {
          id: row.id,
          mime: row.mime,
          friendlyName: row.friendly_name,
          ownerId: row.owner_id,
          ownerName: row.owner_name ?? undefined,
          isPublic: row.is_public,
          sizeBytes: row.size_bytes,
          createdAt: row.created_at,
          tags: [],
        };
        byId.set(row.id, member);
        const group = byHash.get(row.content_hash);
        if (group) {
          group.push(member);
        } else {
          byHash.set(row.content_hash, [member]);
        }
      }
      if (row.key) {
        member.tags.push({
          key: row.key,
          value: row.value ?? undefined,
          type: row.type ?? "default",
        });
      }
    }

    return byHash;
  }

  /** On-disk locations for documents that are about to be deleted. */
  public async getFileLocations(
    documentIds: string[],
  ): Promise<DocumentFileLocation[]> {
    if (documentIds.length === 0) return [];
    return this.dbService.any(
      pathRowSchema,
      "SELECT id, base_path, filename FROM documents WHERE id = ANY($documentIds)",
      { documentIds },
    );
  }

  /**
   * Collapses a duplicate group in a single transaction: every tag on a merged
   * document is copied onto the keeper, the caller's explicit tag edits are
   * applied on top, and the merged documents are removed.
   *
   * Access settings (`is_public` and shares) are deliberately left untouched —
   * unioning them would silently widen access to the keeper, so the keeper's
   * own settings always win.
   */
  public async mergeGroup(
    keepId: string,
    mergeIds: string[],
    tagsToAdd: ApiTag[],
    tagsToRemove: ApiTag[],
  ): Promise<void> {
    await this.dbService.transaction(async () => {
      // Union: everything the merged documents were tagged with, including
      // `collection:<id>` membership tags, moves to the keeper.
      await this.dbService.none(
        `INSERT INTO userdata_tags (userdata_id, tag_id)
         SELECT $keepId, ut.tag_id
         FROM userdata_tags ut
         WHERE ut.userdata_id = ANY($mergeIds)
         ON CONFLICT DO NOTHING`,
        { keepId, mergeIds },
      );

      // Removals run before additions so a tag named in both ends up present.
      // `IS NOT DISTINCT FROM` rather than `=` so value-less tags, which are
      // stored with a NULL value, still match.
      if (tagsToRemove.length > 0) {
        await this.dbService.none(
          `DELETE FROM userdata_tags ut
           USING tags t, jsonb_array_elements($tagsToRemove::jsonb) AS tag
           WHERE ut.userdata_id = $keepId
             AND ut.tag_id = t.id
             AND t.key   IS NOT DISTINCT FROM tag->>'key'
             AND t.value IS NOT DISTINCT FROM tag->>'value'
             AND t.type  IS NOT DISTINCT FROM tag->>'type'`,
          { keepId, tagsToRemove: JSON.stringify(tagsToRemove) },
        );
      }

      if (tagsToAdd.length > 0) {
        await this.dbService.none(
          `INSERT INTO userdata_tags (userdata_id, tag_id)
           SELECT $keepId, t.id
           FROM tags t, jsonb_array_elements($tagsToAdd::jsonb) AS tag
           WHERE t.key   IS NOT DISTINCT FROM tag->>'key'
             AND t.value IS NOT DISTINCT FROM tag->>'value'
             AND t.type  IS NOT DISTINCT FROM tag->>'type'
           ON CONFLICT DO NOTHING`,
          { keepId, tagsToAdd: JSON.stringify(tagsToAdd) },
        );
      }

      await this.dbService.none(
        "DELETE FROM userdata_tags WHERE userdata_id = ANY($mergeIds)",
        { mergeIds },
      );
      await this.dbService.none(
        "DELETE FROM documents WHERE id = ANY($mergeIds)",
        { mergeIds },
      );
    });
  }

  /**
   * Documents still awaiting a content hash, oldest first. `excludeIds` carries
   * the rows that already failed during this run — without it a document whose
   * file is missing from disk would be handed back on every page forever.
   */
  public async listUnhashedDocuments(
    limit: number,
    excludeIds: string[] = [],
  ): Promise<DocumentFileLocation[]> {
    return this.dbService.any(
      pathRowSchema,
      `SELECT id, base_path, filename
       FROM documents
       WHERE content_hash IS NULL
         AND NOT (id = ANY($excludeIds))
       ORDER BY created_at ASC
       LIMIT $limit`,
      { limit, excludeIds },
    );
  }

  public async countUnhashedDocuments(): Promise<number> {
    const row = await this.dbService.one(
      z.object({ count: z.coerce.number().int() }),
      "SELECT COUNT(*) AS count FROM documents WHERE content_hash IS NULL",
    );
    return row.count;
  }

  public async setContentHash(
    documentId: string,
    contentHash: string,
    sizeBytes: number,
  ): Promise<void> {
    await this.dbService.none(
      `UPDATE documents
       SET content_hash = $contentHash, size_bytes = $sizeBytes
       WHERE id = $documentId`,
      { documentId, contentHash, sizeBytes },
    );
  }
}
