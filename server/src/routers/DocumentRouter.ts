import { Router } from "express";
import { apiHandler, FileDownload, FileStream } from "../ApiHandler.js";
import { ApiError } from "../common/ApiError.js";
import { services } from "../DefaultDiContainer.js";
import type { EmptyObject } from "../common/EmptyObject.js";
import type { DocumentService } from "../documents/DocumentService.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type {
  Document,
  DocumentWithTags,
} from "../documents/DocumentRepository.js";
import type { TagService } from "../tags/TagService.js";
import z from "zod";
import type { UploadService } from "../files/UploadService.js";
import type { ApiTag } from "../tags/TagRepository.js";

export const documentRouter = Router();

type DocumentUpload = {
  tags: string;
};

type BulkEditDocumentsRequest = {
  documentIds: string[];
  tagsToAdd: ApiTag[];
  tagsToRemove: ApiTag[];
};

documentRouter.post(
  "/upload",
  apiHandler<
    EmptyObject,
    { webSocketClientId: string; extension: string },
    DocumentUpload
  >(
    async ({
      diContainer,
      files,
      query: { webSocketClientId, extension },
      body: { tags },
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

      const uploadService = diContainer.get<UploadService>(services.upload);
      // Process the upload asynchronously
      void uploadService.processUploadDocument({
        name: file.name,
        file: file.tempFilePath,
        size: file.size,
        mimeType: file.mimetype,
        webSocketClientId: decodeURIComponent(webSocketClientId),
        extension,
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
  apiHandler<
    PaginatedResponse<Document>,
    { limit?: number; offset?: number; query?: string; seed?: string }
  >(
    async ({
      diContainer,
      query: { limit = 100, offset = 0, query = "", seed },
    }) => {
      const tagService = diContainer.get<TagService>(services.tag);
      const response = await tagService.listDocuments({
        limit,
        offset,
        query: decodeURIComponent(query),
        seed: seed ?? "",
      });
      return {
        status: 200,
        body: response,
      };
    },
  ),
);

documentRouter.get(
  "/by-ids",
  apiHandler<DocumentWithTags[], { id: string | string[] }>(
    async ({ diContainer, query: { id } }) => {
      const ids = Array.isArray(id) ? id : [id];
      const tagService = diContainer.get<TagService>(services.tag);
      const response = await tagService.listDocumentsByIds(ids);
      return {
        status: 200,
        body: response,
      };
    },
  ),
);

documentRouter.post(
  "/bulk-edit",
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
  apiHandler<FileDownload, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id } }) => {
      const documentService = diContainer.get<DocumentService>(
        services.document,
      );
      const thumbnailPath = await documentService.getDocumentThumbnail(id);
      return {
        status: 200,
        body: new FileDownload(thumbnailPath, "image/jpeg"),
      };
    },
  ),
);

documentRouter.get(
  "/:id",
  apiHandler<
    FileDownload | FileStream,
    EmptyObject,
    EmptyObject,
    { id: string }
  >(async ({ diContainer, params: { id }, headers }) => {
    const documentService = diContainer.get<DocumentService>(services.document);
    const result = await documentService.getDocument(id, headers.range);
    return {
      status: 200,
      body: result,
    };
  }),
);
