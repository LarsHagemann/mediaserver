import { v4 as uuidv4 } from "uuid";
import { TagParser } from "@lars_hagemann/tags";
import { ApiError } from "../common/ApiError.js";
import type {
  Collection,
  CollectionRepository,
  CollectionType,
  UpdateCollectionRequest,
} from "./CollectionRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type { TagService } from "../tags/TagService.js";

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
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
  }): Promise<PaginatedResponse<Collection>> {
    return this.collectionRepository.listCollections(request);
  }

  public async getCollection(id: string): Promise<Collection> {
    const collection = await this.collectionRepository.getCollection(id);
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
  ): Promise<Collection> {
    const existing = await this.getCollection(request.id);
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

  public async deleteCollection(id: string): Promise<void> {
    const collection = await this.getCollection(id);
    if (collection.type === "static") {
      await this.tagService.deleteTag("collection", id);
    }
    await this.collectionRepository.deleteCollection(id);
  }

  public async addMember(
    collectionId: string,
    documentId: string,
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
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
    );
  }

  public async removeMember(
    collectionId: string,
    documentId: string,
  ): Promise<void> {
    const collection = await this.getCollection(collectionId);
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
}
