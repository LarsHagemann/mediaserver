import { TagParser } from "@lars_hagemann/tags";
import { ApiError } from "../common/ApiError.js";
import type {
  Collection,
  CollectionRepository,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "./CollectionRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";

export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

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
    this.validateFilterExpression(request.filterExpression);
    return this.collectionRepository.createCollection(request);
  }

  public async updateCollection(
    request: UpdateCollectionRequest,
  ): Promise<Collection> {
    this.validateFilterExpression(request.filterExpression);
    const collection =
      await this.collectionRepository.updateCollection(request);
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
    await this.collectionRepository.deleteCollection(id);
  }
}
