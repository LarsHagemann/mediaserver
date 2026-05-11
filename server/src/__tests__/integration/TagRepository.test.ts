import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TagRepository } from "../../tags/TagRepository.js";
import { DocumentRepository } from "../../documents/DocumentRepository.js";
import { createTestDb } from "../helpers/testDb.js";
import type { DbService } from "../../sql/DbService.js";
import type { TagCache } from "../../tags/TagCache.js";
import type { Tag, MetaTag } from "@lars_hagemann/tags";

/** In-memory replacement for TagCache (no Redis required in tests) */
const makeInMemoryTagCache = (): TagCache => {
  const store = new Map<string, string>();
  return {
    init: async (tags: { tag: Tag | MetaTag; tagId: string }[]) => {
      for (const { tag, tagId } of tags) {
        const key = `${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
        store.set(`tag:${key}`, tagId);
      }
    },
    tagToTagId: async (tag: Tag | MetaTag) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      const id = store.get(key);
      if (!id) throw new Error(`Tag not found in cache: ${tag.key}`);
      return id;
    },
    onTagAdded: async (tag: Tag | MetaTag, tagId: string) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      store.set(key, tagId);
    },
    onTagDeleted: async (tag: Tag | MetaTag) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      store.delete(key);
    },
  } as unknown as TagCache;
};

describe("TagRepository (integration)", () => {
  let dbService: DbService;
  let teardown: () => Promise<void>;
  let tagRepository: TagRepository;
  let documentRepository: DocumentRepository;
  let tagCache: TagCache;

  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
  const DOC_ID_1 = "00000000-0000-0000-0000-000000000001";
  const DOC_ID_2 = "00000000-0000-0000-0000-000000000002";

  // Users for access scope tests
  const VIEWER_USER_ID = "00000000-0000-0000-0000-000000000010";
  const FOREIGN_OWNER_ID = "00000000-0000-0000-0000-000000000011";

  // Documents for access scope tests
  const DOC_PUBLIC = "00000000-0000-0000-0000-000000000020";
  const DOC_VIEWER_PRIVATE = "00000000-0000-0000-0000-000000000021";
  const DOC_FOREIGN_PRIVATE = "00000000-0000-0000-0000-000000000022";
  const DOC_SHARED_WITH_VIEWER = "00000000-0000-0000-0000-000000000023";

  beforeAll(async () => {
    ({ dbService, teardown } = await createTestDb());
    tagCache = makeInMemoryTagCache();
    tagRepository = new TagRepository(dbService, tagCache);
    documentRepository = new DocumentRepository(dbService);

    // Seed extra users for access scope tests
    await dbService.none(
      "INSERT INTO users (id, external_id, name) VALUES ($id, $externalId, $name)",
      { id: VIEWER_USER_ID, externalId: "viewer", name: "Viewer" },
    );
    await dbService.none(
      "INSERT INTO users (id, external_id, name) VALUES ($id, $externalId, $name)",
      { id: FOREIGN_OWNER_ID, externalId: "foreign", name: "Foreign Owner" },
    );

    // Seed documents used across tag tests
    await documentRepository.createDocument({
      id: DOC_ID_1,
      basePath: "/data",
      filename: "photo.jpg",
      friendlyName: "photo.jpg",
      type: "image/jpeg",
      isPublic: true,
      ownerId: SYSTEM_USER_ID,
    });
    await documentRepository.createDocument({
      id: DOC_ID_2,
      basePath: "/data",
      filename: "video.mp4",
      friendlyName: "video.mp4",
      type: "video/mp4",
      isPublic: true,
      ownerId: SYSTEM_USER_ID,
    });

    // Seed documents for access scope tests
    await documentRepository.createDocument({
      id: DOC_PUBLIC,
      basePath: "/data",
      filename: "public.jpg",
      friendlyName: "public.jpg",
      type: "image/jpeg",
      isPublic: true,
      ownerId: FOREIGN_OWNER_ID,
    });
    await documentRepository.createDocument({
      id: DOC_VIEWER_PRIVATE,
      basePath: "/data",
      filename: "viewer-private.jpg",
      friendlyName: "viewer-private.jpg",
      type: "image/jpeg",
      isPublic: false,
      ownerId: VIEWER_USER_ID,
    });
    await documentRepository.createDocument({
      id: DOC_FOREIGN_PRIVATE,
      basePath: "/data",
      filename: "foreign-private.jpg",
      friendlyName: "foreign-private.jpg",
      type: "image/jpeg",
      isPublic: false,
      ownerId: FOREIGN_OWNER_ID,
    });
    await documentRepository.createDocument({
      id: DOC_SHARED_WITH_VIEWER,
      basePath: "/data",
      filename: "shared.jpg",
      friendlyName: "shared.jpg",
      type: "image/jpeg",
      isPublic: false,
      ownerId: FOREIGN_OWNER_ID,
    });
    await dbService.none(
      "INSERT INTO document_shares (document_id, shared_with_user_id) VALUES ($docId, $userId)",
      { docId: DOC_SHARED_WITH_VIEWER, userId: VIEWER_USER_ID },
    );
  });

  afterAll(async () => {
    await teardown();
  });

  describe("addTags", () => {
    it("inserts tags without error", async () => {
      await expect(
        tagRepository.addTags([
          { key: "nature", value: undefined, type: "default" },
          { key: "uploaded", value: "01.01.2025", type: "meta" },
        ]),
      ).resolves.toBeUndefined();
    });

    it("is idempotent (ON CONFLICT DO NOTHING)", async () => {
      await expect(
        tagRepository.addTags([{ key: "nature", value: undefined, type: "default" }]),
      ).resolves.toBeUndefined();
    });
  });

  describe("addTagToDocument / getTagsForDocument", () => {
    it("adds a tag and retrieves it for a document", async () => {
      await tagRepository.addTags([{ key: "landscape", value: undefined, type: "default" }]);
      await tagRepository.addTagToDocument(DOC_ID_1, {
        key: "landscape",
        value: undefined,
        type: "default",
      });

      const tags = await tagRepository.getTagsForDocument(DOC_ID_1);
      expect(tags.some((t) => t.key === "landscape")).toBe(true);
    });
  });

  describe("removeTagFromDocument", () => {
    it("removes a tag from a document", async () => {
      await tagRepository.addTags([{ key: "removable", value: undefined, type: "default" }]);
      await tagRepository.addTagToDocument(DOC_ID_2, {
        key: "removable",
        value: undefined,
        type: "default",
      });

      await tagRepository.removeTagFromDocument(DOC_ID_2, {
        key: "removable",
      } as Tag);

      const tags = await tagRepository.getTagsForDocument(DOC_ID_2);
      expect(tags.some((t) => t.key === "removable")).toBe(false);
    });
  });

  describe("listTags", () => {
    it("returns tags with usage count", async () => {
      const result = await tagRepository.listTags({
        limit: 100,
        offset: 0,
        tag: { key: "", value: undefined, type: "default" },
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.items.every((t) => typeof t.usageCount === "number")).toBe(true);
    });

    it("respects limit and offset", async () => {
      const page1 = await tagRepository.listTags({
        limit: 1,
        offset: 0,
        tag: { key: "", value: undefined, type: "default" },
      });
      expect(page1.items).toHaveLength(1);
    });
  });

  describe("listDocuments", () => {
    it("returns documents matching a tag query", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "landscape",
      });

      expect(result.items.some((d) => d.id === DOC_ID_1)).toBe(true);
    });

    it("returns empty result for unmatched query", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "nonexistent-tag-xyz",
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("returns all documents when query is empty", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "",
      });

      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("deleteTag", () => {
    it("removes tag and its document associations", async () => {
      await tagRepository.addTags([{ key: "to-delete", value: "yes", type: "default" }]);
      await tagRepository.addTagToDocument(DOC_ID_1, {
        key: "to-delete",
        value: "yes",
        type: "default",
      });

      await tagRepository.deleteTag("to-delete", "yes");

      const tags = await tagRepository.getTagsForDocument(DOC_ID_1);
      expect(tags.some((t) => t.key === "to-delete")).toBe(false);
    });
  });

  describe("enumerateTags", () => {
    it("returns all tags in the database", async () => {
      const tags = await tagRepository.enumerateTags();

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags[0]).toMatchObject({ id: expect.any(Number), key: expect.any(String) });
    });
  });

  describe("listDocuments — document access scope", () => {
    const scope = (userId: string) => ({ type: "accessible-by" as const, userId });

    it("viewer can see public documents", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "",
        scope: scope(VIEWER_USER_ID),
      });
      const ids = result.items.map((d) => d.id);
      expect(ids).toContain(DOC_PUBLIC);
    });

    it("viewer can see their own private documents", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "",
        scope: scope(VIEWER_USER_ID),
      });
      const ids = result.items.map((d) => d.id);
      expect(ids).toContain(DOC_VIEWER_PRIVATE);
    });

    it("viewer cannot see foreign private documents", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "",
        scope: scope(VIEWER_USER_ID),
      });
      const ids = result.items.map((d) => d.id);
      expect(ids).not.toContain(DOC_FOREIGN_PRIVATE);
    });

    it("viewer can see documents shared with them", async () => {
      const result = await tagRepository.listDocuments({
        limit: 100,
        offset: 0,
        query: "",
        scope: scope(VIEWER_USER_ID),
      });
      const ids = result.items.map((d) => d.id);
      expect(ids).toContain(DOC_SHARED_WITH_VIEWER);
    });
  });
});
