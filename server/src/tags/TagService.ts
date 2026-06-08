import { MetaTag, Tag } from "@lars_hagemann/tags";
import type {
  ApiTag,
  ListDocumentsRequest,
  TagRepository,
} from "./TagRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type {
  Document,
  DocumentWithTags,
} from "../documents/DocumentRepository.js";
import type { TagCache } from "./TagCache.js";
import type { DocumentAccessScope } from "../auth/AccessScope.js";

export type ListTagsRequest = {
  limit: number;
  offset: number;
  query: string;
};

export class TagService {
  constructor(
    private tagRepository: TagRepository,
    private readonly tagCache: TagCache,
  ) {}

  public static normalizeTag(tag: string, type: string = "default"): ApiTag {
    const parts = tag.split(":", 2);
    if (parts.length === 1) {
      return { key: parts[0]!.trim(), value: undefined, type };
    } else {
      return { key: parts[0]!.trim(), value: parts[1]!.trim(), type };
    }
  }

  public static toString(tag: Tag | MetaTag) {
    return `${tag.key}${"value" in tag ? `:${tag.value}` : ""}`;
  }

  public async listTags(request: ListTagsRequest) {
    return this.tagRepository.listTags({
      ...request,
      tag: TagService.normalizeTag(request.query),
    });
  }

  public async listDocuments(
    request: ListDocumentsRequest,
    scope: DocumentAccessScope = { type: "all" },
  ): Promise<PaginatedResponse<Document>> {
    return this.tagRepository.listDocuments({ ...request, scope });
  }

  public async listDocumentsByIds(
    ids: string[],
    scope: DocumentAccessScope = { type: "all" },
  ): Promise<DocumentWithTags[]> {
    return this.tagRepository.listDocumentsByIds(ids, scope);
  }

  public async getTagsForDocument(documentId: string): Promise<ApiTag[]> {
    return await this.tagRepository.getTagsForDocument(documentId);
  }

  public async addTagToDocument(
    documentId: string,
    tag: string,
    type: string = "default",
  ) {
    const tagObject = TagService.normalizeTag(tag, type);
    await this.tagRepository.addTags([tagObject]);
    await this.tagRepository.addTagToDocument(documentId, tagObject);
  }

  public async removeTagFromDocument(documentId: string, tag: string) {
    const tagObject = TagService.normalizeTag(tag);
    await this.tagRepository.removeTagFromDocument(documentId, tagObject);
  }

  public async deleteTag(key: string, value: string): Promise<void> {
    await this.tagRepository.deleteTag(key, value);
  }

  public async initIdCache(): Promise<void> {
    const tags = await this.tagRepository.enumerateTags();
    this.tagCache.init(
      tags.map((tag) => ({
        tagId: tag.id.toString(),
        tag: TagService.normalizeTag(
          `${tag.key}${tag.value ? `:${tag.value}` : ""}`,
        ),
      })),
    );
  }

  public async bulkEditDocuments(
    documentIds: string[],
    tagsToAdd: ApiTag[],
    tagsToRemove: ApiTag[],
  ): Promise<void> {
    await this.tagRepository.bulkEditDocuments(
      documentIds,
      tagsToAdd,
      tagsToRemove,
    );
  }
}
