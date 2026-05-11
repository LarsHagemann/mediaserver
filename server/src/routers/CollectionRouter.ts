import { Router } from "express";
import z from "zod";
import { apiHandler } from "../ApiHandler.js";
import { services } from "../DefaultDiContainer.js";
import type { CollectionService } from "../collections/CollectionService.js";
import type {
  Collection,
  CollectionAccess,
} from "../collections/CollectionRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type { EmptyObject } from "../common/EmptyObject.js";
import type { AccessScopeResolver } from "../auth/AccessScopeResolver.js";
import { requirePermission } from "../auth/requirePermission.js";
import { SYSTEM_USER_ID } from "../auth/Identity.js";

export const collectionRouter = Router();

collectionRouter.get(
  "/",
  requirePermission("collection:read"),
  apiHandler<
    PaginatedResponse<Collection>,
    { limit?: number; offset?: number; type: "dynamic" | "static" | undefined }
  >(
    async ({
      diContainer,
      query: { limit = 20, offset = 0, type = undefined },
      identity,
    }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.collectionScope(identity);
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      const response = await collectionService.listCollections({
        limit,
        offset,
        type,
        scope,
      });
      return { status: 200, body: response };
    },
  ),
);

collectionRouter.post(
  "/",
  requirePermission("collection:create"),
  apiHandler<
    Collection,
    EmptyObject,
    {
      name: string;
      description?: string;
      filterExpression?: string;
      isFavorite?: boolean;
      type?: "dynamic" | "static";
      isPublic?: boolean;
    }
  >(async ({ diContainer, body, identity }) => {
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    const type = body.type ?? "dynamic";
    const ownerId =
      identity.userId === "system" || identity.userId === null
        ? SYSTEM_USER_ID
        : identity.userId;
    const collection = await collectionService.createCollection({
      name: body.name,
      ...(body.description !== undefined && { description: body.description }),
      filterExpression: body.filterExpression ?? "",
      isFavorite: body.isFavorite ?? false,
      type,
      ownerId,
      isPublic: body.isPublic ?? true,
    });
    return { status: 201, body: collection };
  }),
);

collectionRouter.get(
  "/:id",
  requirePermission("collection:read"),
  apiHandler<Collection, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.collectionScope(identity);
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      const collection = await collectionService.getCollection(id, scope);
      return { status: 200, body: collection };
    },
  ),
);

collectionRouter.put(
  "/:id",
  requirePermission("collection:update"),
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
  >(async ({ diContainer, params: { id }, body, identity }) => {
    const scopeResolver = diContainer.get<AccessScopeResolver>(
      services.accessScopeResolver,
    );
    const scope = scopeResolver.collectionScope(identity);
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    const collection = await collectionService.updateCollection(
      {
        id,
        name: body.name,
        description: body.description,
        filterExpression: body.filterExpression ?? "",
        isFavorite: body.isFavorite,
      },
      scope,
    );
    return { status: 200, body: collection };
  }),
);

collectionRouter.delete(
  "/:id",
  requirePermission("collection:delete"),
  apiHandler<EmptyObject, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.collectionScope(identity);
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      await collectionService.deleteCollection(id, scope);
      return { status: 204, body: {} };
    },
  ),
);

collectionRouter.post(
  "/:id/members",
  requirePermission("collection:update"),
  apiHandler<EmptyObject, EmptyObject, { documentId: string }, { id: string }>(
    async ({ diContainer, params: { id }, body, identity }) => {
      const scopeResolver = diContainer.get<AccessScopeResolver>(
        services.accessScopeResolver,
      );
      const scope = scopeResolver.collectionScope(identity);
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      await collectionService.addMember(id, body.documentId, scope);
      return { status: 204, body: {} };
    },
  ),
);

collectionRouter.delete(
  "/:id/members/:documentId",
  requirePermission("collection:update"),
  apiHandler<
    EmptyObject,
    EmptyObject,
    EmptyObject,
    { id: string; documentId: string }
  >(async ({ diContainer, params: { id, documentId }, identity }) => {
    const scopeResolver = diContainer.get<AccessScopeResolver>(
      services.accessScopeResolver,
    );
    const scope = scopeResolver.collectionScope(identity);
    const collectionService = diContainer.get<CollectionService>(
      services.collection,
    );
    await collectionService.removeMember(id, documentId, scope);
    return { status: 204, body: {} };
  }),
);

collectionRouter.get(
  "/:id/access",
  requirePermission("collection:read"),
  apiHandler<CollectionAccess, EmptyObject, EmptyObject, { id: string }>(
    async ({ diContainer, params: { id }, identity }) => {
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      const access = await collectionService.getCollectionAccess(id, identity);
      return { status: 200, body: access };
    },
  ),
);

collectionRouter.put(
  "/:id/access",
  requirePermission("collection:read"),
  apiHandler<EmptyObject, EmptyObject, Record<string, unknown>, { id: string }>(
    async ({ diContainer, params: { id }, body, identity }) => {
      const updateSchema = z.object({
        isPublic: z.boolean(),
        sharedWith: z.array(z.string().uuid()),
      });
      const update = updateSchema.parse(body);
      const collectionService = diContainer.get<CollectionService>(
        services.collection,
      );
      await collectionService.updateCollectionAccess(id, identity, update);
      return { status: 204, body: {} };
    },
  ),
);
