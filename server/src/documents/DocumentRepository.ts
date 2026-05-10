import z from "zod";
import type { DbService } from "../sql/DbService.js";
import type { ApiTag } from "../tags/TagRepository.js";
import { ApiError } from "../common/ApiError.js";
import type { DocumentAccessScope } from "../auth/AccessScope.js";

export type CreateDocumentRequest = {
  id: string;
  basePath: string;
  filename: string;
  type: string;
  ownerId: string;
};

export type Document = {
  id: string;
  mime: string;
  previousId: string | undefined;
  nextId: string | undefined;
  queryIndex: number;
  ownerId: string;
  isPublic: boolean;
};

export type DocumentWithTags = Document & {
  tags: ApiTag[];
};

export type DocumentWithPathInfo = Document & {
  base_path: string;
  filename: string;
};

export type DocumentAccess = {
  ownerId: string;
  isPublic: boolean;
  shares: { userId: string; name: string | null; email: string | null }[];
};

const documentWithPathInfoSchema = z.object({
  id: z.string(),
  mime: z.string(),
  base_path: z.string(),
  filename: z.string(),
  owner_id: z.string(),
  is_public: z.boolean(),
});

export class DocumentRepository {
  constructor(private readonly dbService: DbService) {}

  public async createDocument(request: CreateDocumentRequest): Promise<void> {
    await this.dbService.none(
      "INSERT INTO documents (id, base_path, filename, mime, owner_id) VALUES ($id, $basePath, $filename, $type, $ownerId)",
      request,
    );
  }

  public async getDocumentWithPathInfo(
    id: string,
    scope: DocumentAccessScope = { type: "all" },
  ): Promise<DocumentWithPathInfo> {
    const scopeClause = buildScopeClause(scope);
    const params: Record<string, unknown> = { id };
    if (scope.type === "accessible-by") params.userId = scope.userId;

    if (scope.type === "none") {
      throw new ApiError("NotFound", 404, `Document ${id} not found`);
    }

    const result = await this.dbService.oneOrNone(
      documentWithPathInfoSchema,
      `SELECT id, mime, base_path, filename, owner_id, is_public FROM documents WHERE id = $id${scopeClause}`,
      params,
    );

    if (!result) {
      throw new ApiError("NotFound", 404, `Document ${id} not found`);
    }

    return {
      id: result.id,
      mime: result.mime,
      base_path: result.base_path,
      filename: result.filename,
      ownerId: result.owner_id,
      isPublic: result.is_public,
      previousId: undefined,
      nextId: undefined,
      queryIndex: 0,
    };
  }

  public async getDocumentAccess(documentId: string): Promise<DocumentAccess> {
    const doc = await this.dbService.oneOrNone(
      z.object({ owner_id: z.string(), is_public: z.boolean() }),
      "SELECT owner_id, is_public FROM documents WHERE id = $id",
      { id: documentId },
    );

    if (!doc) {
      throw new ApiError("NotFound", 404, `Document ${documentId} not found`);
    }

    const shares = await this.dbService.any(
      z.object({ user_id: z.string(), name: z.string().nullable(), email: z.string().nullable() }),
      `SELECT ds.shared_with_user_id AS user_id, u.name, u.email
       FROM document_shares ds
       JOIN users u ON ds.shared_with_user_id = u.id
       WHERE ds.document_id = $documentId`,
      { documentId },
    );

    return {
      ownerId: doc.owner_id,
      isPublic: doc.is_public,
      shares: shares.map((s) => ({ userId: s.user_id, name: s.name, email: s.email })),
    };
  }

  public async updateDocumentAccess(
    documentId: string,
    { isPublic, sharedWith }: { isPublic: boolean; sharedWith: string[] },
  ): Promise<void> {
    await this.dbService.transaction(async () => {
      await this.dbService.none(
        "UPDATE documents SET is_public = $isPublic WHERE id = $documentId",
        { isPublic, documentId },
      );
      await this.dbService.none(
        "DELETE FROM document_shares WHERE document_id = $documentId",
        { documentId },
      );
      for (const userId of sharedWith) {
        await this.dbService.none(
          "INSERT INTO document_shares (document_id, shared_with_user_id) VALUES ($documentId, $userId) ON CONFLICT DO NOTHING",
          { documentId, userId },
        );
      }
    });
  }

  public async deleteDocument(documentId: string): Promise<void> {
    await this.dbService.transaction(async () => {
      await this.dbService.none(
        "DELETE FROM userdata_tags WHERE userdata_id = $documentId",
        { documentId },
      );
      await this.dbService.none(
        "DELETE FROM documents WHERE id = $documentId",
        { documentId },
      );
    });
  }
}

export function buildScopeClause(scope: DocumentAccessScope): string {
  if (scope.type === "all") return "";
  if (scope.type === "none") return " AND false";
  if (scope.type === "public-only") return " AND is_public = true";
  return " AND (is_public = true OR owner_id = $userId OR EXISTS (SELECT 1 FROM document_shares ds WHERE ds.document_id = id AND ds.shared_with_user_id = $userId))";
}

export function buildScopeHaving(scope: DocumentAccessScope, tableAlias: string): string {
  if (scope.type === "all") return "";
  if (scope.type === "none") return " AND false";
  if (scope.type === "public-only") return ` AND ${tableAlias}.is_public = true`;
  return ` AND (${tableAlias}.is_public = true OR ${tableAlias}.owner_id = $userId OR EXISTS (SELECT 1 FROM document_shares ds WHERE ds.document_id = ${tableAlias}.id AND ds.shared_with_user_id = $userId))`;
}
