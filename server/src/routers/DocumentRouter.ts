import { Router } from "express";
import { apiHandler, FileDownload, FileStream } from "../ApiHandler.js";
import { ApiError } from "../common/ApiError.js";
import { services } from "../DefaultDiContainer.js";
import type { EmptyObject } from "../common/EmptyObject.js";
import type { DocumentService } from "../documents/DocumentService.js";
import type { DocumentAccess } from "../documents/DocumentRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type {
  Document,
  DocumentWithTags,
} from "../documents/DocumentRepository.js";
import type { TagService } from "../tags/TagService.js";
import type { AccessScopeResolver } from "../auth/AccessScopeResolver.js";
import z from "zod";
import type { UploadService } from "../files/UploadService.js";
import type { ApiTag } from "../tags/TagRepository.js";
import { requirePermission } from "../auth/requirePermission.js";
import { SYSTEM_USER_ID } from "../auth/Identity.js";

export const documentRouter = Router();

type DocumentUpload = {
  tags: string;
  isPublic: string;
};

type BulkEditDocumentsRequest = {
  documentIds: string[];
  tagsToAdd: ApiTag[];
  tagsToRemove: ApiTag[];
};

type UpdateDocumentAccessRequest = {
  isPublic: boolean;
  sharedWith: string[];
};

documentRouter.post(
  "/upload",
  requirePermission("document:upload"),
  apiHandler<
    EmptyObject,
    { webSocketClientId: string; extension: string },
    DocumentUpload
  >(
    async ({
      diContainer,
      files,
      query: { webSocketClientId, extension },
      body: { tags, isPublic },
      identity,
    }) => {
      const file = files?.upload;
      if (!file || Array.isArray(file)) {
        throw new ApiError(
          "BadRequest",
          400,
          "None or more than one file uploaded",
        );
      }

      if (!webSocketClientId) {
        throw new ApiError("BadRequest", 400, "Missing webSocketClientId");
      }

      if (!extension) {
        throw new ApiError("BadRequest", 400, "Missing extension");
      }

      const ownerId =
        identity.userId === "system" || identity.userId === null
          ? SYSTEM_USER_ID
          : identity.userId;

      const uploadService = diContainer.get<UploadService>(services.upload);
      void uploadService.processUploadDocument({
        name: file.name,
        file: file.tempFilePath,
        size: file.size,
        mimeType: file.mimetype,
        webSocketClientId: decodeURIComponent(webSocketClientId),
        extension,
        ownerId,
        isPublic: isPublic === "true",
        tags: z
          .array(
            z.object({
              key: z.string(),
              value: z.string().or(z.undefined()),
              type: z.string(),
            }),
          )
          .parse(JSON.parse(tags)),
      });

      return {
        status: 204,
        body: {},
      };
    },
  ),
);

documentRouter.get(
  "/",
  requirePermission("document:read"),
  apiHandler<
    PaginatedResponse<Document>,
    { limit?: number; offset?: number; query?: string; seed?: string }
  >(
    async ({
      diContainer,
      query: { limit = 100, offset = 0, query = "", seed },
      identity,
    }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.documentScope(identity);
      const tagService = diContainer.get<TagService>(services.tag);
      const response = await tagService.listDocuments(
        {
          limit,
          offset,
          query: decodeURIComponent(query),
          seed: seed ?? "",
        },
        scope,
      );
      return {
        status: 200,
        body: response,
      };
    },
  ),
);

documentRouter.get(
  "/by-ids",
  requirePermission("document:read"),
  apiHandler<DocumentWithTags[], { id: string | string[] }>(
    async ({ diContainer, query: { id }, identity }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.documentScope(identity);
      const ids = Array.isArray(id) ? id : [id];
      const tagService = diContainer.get<TagService>(services.tag);
      const response = await tagService.listDocumentsByIds(ids, scope);
      return {
        status: 200,
        body: response,
      };
    },
  ),
);

documentRouter.post(
  "/bulk-edit",
  requirePermission("tag:manage"),
  apiHandler<EmptyObject, EmptyObject, BulkEditDocumentsRequest>(
    async ({ diContainer, body }) => {
      const tagService = diContainer.get<TagService>(services.tag);
      await tagService.bulkEditDocuments(
        body.documentIds,
        body.tagsToAdd,
        body.tagsToRemove,
      );
      return {
        status: 204,
        body: {},
      };
    },
  ),
);

documentRouter.get(
  "/:id/thumbnail",
  requirePermission("document:read"),
  apiHandler<FileDownload, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.documentScope(identity);
      const documentService = diContainer.get<DocumentService>(
        services.document,
      );
      const thumbnailPath = await documentService.getDocumentThumbnail(
        id,
        scope,
      );
      return {
        status: 200,
        body: new FileDownload(thumbnailPath, "image/jpeg"),
      };
    },
  ),
);

documentRouter.get(
  "/:id/access",
  requirePermission("document:read"),
  apiHandler<DocumentAccess, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const documentService = diContainer.get<DocumentService>(
        services.document,
      );
      const access = await documentService.getDocumentAccess(id, identity);
      return {
        status: 200,
        body: access,
      };
    },
  ),
);

documentRouter.put(
  "/:id/access",
  requirePermission("document:read"),
  apiHandler<
    EmptyObject,
    EmptyObject,
    UpdateDocumentAccessRequest,
    { id: string }
  >(async ({ diContainer, params: { id }, body, identity }) => {
    const updateSchema = z.object({
      isPublic: z.boolean(),
      sharedWith: z.array(z.string().uuid()),
    });
    const update = updateSchema.parse(body);
    const documentService = diContainer.get<DocumentService>(services.document);
    await documentService.updateDocumentAccess(id, identity, update);
    return {
      status: 204,
      body: {},
    };
  }),
);

documentRouter.delete(
  "/:id",
  apiHandler<EmptyObject, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const documentService = diContainer.get<DocumentService>(
        services.document,
      );
      await documentService.deleteDocument(id, identity);
      return {
        status: 204,
        body: {},
      };
    },
  ),
);

documentRouter.get(
  "/:id",
  requirePermission("document:read"),
  apiHandler<
    FileDownload | FileStream,
    EmptyObject,
    EmptyObject,
    { id: string }
  >(async ({ diContainer, params: { id }, headers, identity }) => {
    const scopeResolver = diContainer.get<AccessScopeResolver>(
      services.accessScopeResolver,
    );
    const scope = scopeResolver.documentScope(identity);
    const documentService = diContainer.get<DocumentService>(services.document);
    const result = await documentService.getDocument(id, headers.range, scope);
    return {
      status: 200,
      body: result,
    };
  }),
);
