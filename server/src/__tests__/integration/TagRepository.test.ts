import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TagRepository } from "../../tags/TagRepository.js";
import { DocumentRepository } from "../../documents/DocumentRepository.js";
import { createTestDb } from "../helpers/testDb.js";
import type { DbService } from "../../sql/DbService.js";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { TagCache } from "../../tags/TagCache.js";
import type { Tag } from "@lars_hagemann/tags";

/** In-memory replacement for TagCache (no Redis required in tests) */
const makeInMemoryTagCache = (): TagCache => {
  const store = new Map<string, string>();
  return {
    init: async (tags) => {
      for (const { tag, tagId } of tags) {
        const key = `${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
        store.set(`tag:${key}`, tagId);
      }
    },
    tagToTagId: async (tag) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      const id = store.get(key);
      if (!id) throw new Error(`Tag not found in cache: ${tag.key}`);
      return id;
    },
    onTagAdded: async (tag, tagId) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      store.set(key, tagId);
    },
    onTagDeleted: async (tag) => {
      const key = `tag:${tag.key}${"value" in tag && tag.value ? `:${tag.value}` : ""}`;
      store.delete(key);
    },
  } as unknown as TagCache;
};

describe("TagRepository (integration)", () => {
  let container: StartedPostgreSqlContainer;
  let dbService: DbService;
  let teardown: () => Promise<void>;
  let tagRepository: TagRepository;
  let documentRepository: DocumentRepository;
  let tagCache: TagCache;

  const DOC_ID_1 = "00000000-0000-0000-0000-000000000001";
  const DOC_ID_2 = "00000000-0000-0000-0000-000000000002";

  beforeAll(async () => {
    ({ container, dbService, teardown } = await createTestDb());
    tagCache = makeInMemoryTagCache();
    tagRepository = new TagRepository(dbService, tagCache);
    documentRepository = new DocumentRepository(dbService);

    // Seed documents used across tests
    await documentRepository.createDocument({
      id: DOC_ID_1,
      basePath: "/data",
      filename: "photo.jpg",
      type: "image/jpeg",
    });
    await documentRepository.createDocument({
      id: DOC_ID_2,
      basePath: "/data",
      filename: "video.mp4",
      type: "video/mp4",
    });
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
});
