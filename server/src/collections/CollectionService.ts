import { v4 as uuidv4 } from "uuid";
import { TagParser } from "@lars_hagemann/tags";
import { ApiError } from "../common/ApiError.js";
import type {
  Collection,
  CollectionAccess,
  CollectionRepository,
  CollectionType,
  UpdateCollectionRequest,
} from "./CollectionRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type { TagService } from "../tags/TagService.js";
import type { CollectionAccessScope } from "../auth/AccessScope.js";
import type { Identity } from "../auth/Identity.js";

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
  ownerId: string;
  isPublic: boolean;
}

export class CollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly tagService: TagService,
  ) {}

  private validateFilterExpression(filterExpression: string): void {
    try {
      new TagParser(filterExpression).parse();
    } catch (err) {
      throw new ApiError(
        "InvalidFilterExpression",
        400,
        err instanceof Error ? err.message : "Invalid filter expression",
      );
    }
  }

  public async listCollections(request: {
    limit: number;
    offset: number;
    type: CollectionType | undefined;
    scope: CollectionAccessScope;
  }): Promise<PaginatedResponse<Collection>> {
    return this.collectionRepository.listCollections(request);
  }

  public async getCollection(
    id: string,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<Collection> {
    const collection = await this.collectionRepository.getCollection(id, scope);
    if (!collection) {
      throw new ApiError(
        "CollectionNotFound",
        404,
        `Collection ${id} not found`,
      );
    }
    return collection;
  }

  public async createCollection(
    request: CreateCollectionRequest,
  ): Promise<Collection> {
    const id = uuidv4();
    if (request.type === "static") {
      return this.collectionRepository.createCollection({
        ...request,
        id,
        filterExpression: `collection:${id}`,
      });
    }
    this.validateFilterExpression(request.filterExpression);
    return this.collectionRepository.createCollection({ ...request, id });
  }

  public async updateCollection(
    request: UpdateCollectionRequest,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<Collection> {
    const existing = await this.getCollection(request.id, scope);
    const effectiveRequest =
      existing.type === "static"
        ? { ...request, filterExpression: `collection:${request.id}` }
        : request;

    if (existing.type === "dynamic") {
      this.validateFilterExpression(effectiveRequest.filterExpression);
    }

    const collection =
      await this.collectionRepository.updateCollection(effectiveRequest);
    if (!collection) {
      throw new ApiError(
        "CollectionNotFound",
        404,
        `Collection ${request.id} not found`,
      );
    }
    return collection;
  }

  public async deleteCollection(
    id: string,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<void> {
    const collection = await this.getCollection(id, scope);
    if (collection.type === "static") {
      await this.tagService.deleteTag("collection", id);
    }
    await this.collectionRepository.deleteCollection(id);
  }

  public async addMember(
    collectionId: string,
    documentId: string,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<void> {
    const collection = await this.getCollection(collectionId, scope);
    if (collection.type !== "static") {
      throw new ApiError(
        "InvalidOperation",
        400,
        "Cannot add members to a dynamic collection",
      );
    }
    await this.tagService.addTagToDocument(
      documentId,
      `collection:${collectionId}`,
      "collection",
    );
  }

  public async removeMember(
    collectionId: string,
    documentId: string,
    scope: CollectionAccessScope = { type: "all" },
  ): Promise<void> {
    const collection = await this.getCollection(collectionId, scope);
    if (collection.type !== "static") {
      throw new ApiError(
        "InvalidOperation",
        400,
        "Cannot remove members from a dynamic collection",
      );
    }
    await this.tagService.removeTagFromDocument(
      documentId,
      `collection:${collectionId}`,
    );
  }

  public async getCollectionAccess(
    collectionId: string,
    identity: Identity,
  ): Promise<CollectionAccess> {
    const access =
      await this.collectionRepository.getCollectionAccess(collectionId);
    if (!canManageAccess(identity, access.ownerId)) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the collection owner or an admin can manage access",
      );
    }
    return access;
  }

  public async updateCollectionAccess(
    collectionId: string,
    identity: Identity,
    update: { isPublic: boolean; sharedWith: string[] },
  ): Promise<void> {
    const access =
      await this.collectionRepository.getCollectionAccess(collectionId);
    if (!canManageAccess(identity, access.ownerId)) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the collection owner or an admin can manage access",
      );
    }
    await this.collectionRepository.updateCollectionAccess(
      collectionId,
      update,
    );
  }
}

function isCollectionOwner(identity: Identity, ownerId: string): boolean {
  return (
    identity.userId !== null &&
    identity.userId !== "system" &&
    identity.userId === ownerId
  );
}

function canManageAccess(identity: Identity, ownerId: string): boolean {
  return (
    isCollectionOwner(identity, ownerId) ||
    identity.hasPermission("admin:users")
  );
}
