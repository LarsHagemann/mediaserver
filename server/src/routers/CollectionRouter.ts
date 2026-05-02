import { Router } from "express";
import { apiHandler } from "../ApiHandler.js";
import { services } from "../DefaultDiContainer.js";
import type { CollectionService } from "../collections/CollectionService.js";
import type { Collection } from "../collections/CollectionRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type { EmptyObject } from "../common/EmptyObject.js";

export const collectionRouter = Router();

collectionRouter.get(
  "/",
  apiHandler<
    PaginatedResponse<Collection>,
    { limit?: number; offset?: number; type: "dynamic" | "static" | undefined }
  >(
    async ({
      diContainer,
      query: { limit = 20, offset = 0, type = undefined },
    }) => {
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      const response = await collectionService.listCollections({
        limit,
        offset,
        type,
      });
      return { status: 200, body: response };
    },
  ),
);

collectionRouter.post(
  "/",
  apiHandler<
    Collection,
    EmptyObject,
    {
      name: string;
      description?: string;
      filterExpression?: string;
      isFavorite?: boolean;
      type?: "dynamic" | "static";
    }
  >(async ({ diContainer, body }) => {
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    const type = body.type ?? "dynamic";
    const collection = await collectionService.createCollection({
      name: body.name,
      ...(body.description !== undefined && { description: body.description }),
      filterExpression: body.filterExpression ?? "",
      isFavorite: body.isFavorite ?? false,
      type,
    });
    return { status: 201, body: collection };
  }),
);

collectionRouter.get(
  "/:id",
  apiHandler<Collection, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id } }) => {
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      const collection = await collectionService.getCollection(id);
      return { status: 200, body: collection };
    },
  ),
);

collectionRouter.put(
  "/:id",
  apiHandler<
    Collection,
    EmptyObject,
    {
      name: string;
      description: string | null;
      filterExpression?: string;
      isFavorite: boolean;
    },
    { id: string }
  >(async ({ diContainer, params: { id }, body }) => {
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    const collection = await collectionService.updateCollection({
      id,
      name: body.name,
      description: body.description,
      filterExpression: body.filterExpression ?? "",
      isFavorite: body.isFavorite,
    });
    return { status: 200, body: collection };
  }),
);

collectionRouter.delete(
  "/:id",
  apiHandler<EmptyObject, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id } }) => {
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      await collectionService.deleteCollection(id);
      return { status: 204, body: {} };
    },
  ),
);

collectionRouter.post(
  "/:id/members",
  apiHandler<EmptyObject, EmptyObject, { documentId: string }, { id: string }>(
    async ({ diContainer, params: { id }, body }) => {
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      await collectionService.addMember(id, body.documentId);
      return { status: 204, body: {} };
    },
  ),
);

collectionRouter.delete(
  "/:id/members/:documentId",
  apiHandler<
    EmptyObject,
    EmptyObject,
    EmptyObject,
    { id: string; documentId: string }
  >(async ({ diContainer, params: { id, documentId } }) => {
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    await collectionService.removeMember(id, documentId);
    return { status: 204, body: {} };
  }),
);
