import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagService } from "../../tags/TagService.js";
import type { TagRepository, ApiTag } from "../../tags/TagRepository.js";
import type { TagCache } from "../../tags/TagCache.js";

const makeTagRepository = (): TagRepository => ({
  listTags: vi.fn(),
  listDocuments: vi.fn(),
  getTagsForDocument: vi.fn(),
  addTags: vi.fn(),
  addTagToDocument: vi.fn(),
  removeTagFromDocument: vi.fn(),
  deleteTag: vi.fn(),
  enumerateTags: vi.fn(),
}) as unknown as TagRepository;

const makeTagCache = (): TagCache =>
  ({
    init: vi.fn(),
    tagToTagId: vi.fn(),
    onTagAdded: vi.fn(),
    onTagDeleted: vi.fn(),
  }) as unknown as TagCache;

describe("TagService", () => {
  let tagRepository: ReturnType<typeof makeTagRepository>;
  let tagCache: ReturnType<typeof makeTagCache>;
  let tagService: TagService;

  beforeEach(() => {
    tagRepository = makeTagRepository();
    tagCache = makeTagCache();
    tagService = new TagService(tagRepository, tagCache);
  });

  describe("normalizeTag", () => {
    it("returns key-only tag when no colon present", () => {
      expect(TagService.normalizeTag("nature")).toEqual({
        key: "nature",
        value: undefined,
        type: "default",
      });
    });

    it("splits on first colon into key/value", () => {
      expect(TagService.normalizeTag("uploaded:01.01.2025")).toEqual({
        key: "uploaded",
        value: "01.01.2025",
        type: "default",
      });
    });

    it("uses provided type", () => {
      expect(TagService.normalizeTag("image/jpeg", "meta")).toEqual({
        key: "image/jpeg",
        value: undefined,
        type: "meta",
      });
    });

    it("trims whitespace from key and value", () => {
      expect(TagService.normalizeTag(" foo : bar ")).toEqual({
        key: "foo",
        value: "bar",
        type: "default",
      });
    });

    it("splits on first colon only (subsequent colons are lost)", () => {
      // split(":", 2) keeps only the first two parts
      expect(TagService.normalizeTag("a:b:c")).toEqual({
        key: "a",
        value: "b",
        type: "default",
      });
    });
  });

  describe("toString", () => {
    it("serializes key-only tag", () => {
      expect(TagService.toString({ key: "nature" } as ApiTag)).toBe("nature");
    });

    it("serializes key:value tag", () => {
      expect(TagService.toString({ key: "uploaded", value: "01.01.2025" } as ApiTag)).toBe(
        "uploaded:01.01.2025",
      );
    });
  });

  describe("addTagToDocument", () => {
    it("normalizes tag and calls repository methods", async () => {
      await tagService.addTagToDocument("doc-1", "nature");
      expect(tagRepository.addTags).toHaveBeenCalledWith([
        { key: "nature", value: undefined, type: "default" },
      ]);
      expect(tagRepository.addTagToDocument).toHaveBeenCalledWith("doc-1", {
        key: "nature",
        value: undefined,
        type: "default",
      });
    });

    it("uses the provided type", async () => {
      await tagService.addTagToDocument("doc-2", "image/jpeg", "meta");
      expect(tagRepository.addTags).toHaveBeenCalledWith([
        { key: "image/jpeg", value: undefined, type: "meta" },
      ]);
    });
  });

  describe("removeTagFromDocument", () => {
    it("normalizes tag and delegates to repository", async () => {
      await tagService.removeTagFromDocument("doc-1", "nature");
      expect(tagRepository.removeTagFromDocument).toHaveBeenCalledWith(
        "doc-1",
        { key: "nature", value: undefined, type: "default" },
      );
    });
  });

  describe("deleteTag", () => {
    it("delegates to repository", async () => {
      await tagService.deleteTag("collection", "abc-123");
      expect(tagRepository.deleteTag).toHaveBeenCalledWith("collection", "abc-123");
    });
  });

  describe("listTags", () => {
    it("passes normalized tag to repository", async () => {
      const mockResult = { items: [], total: 0 };
      vi.mocked(tagRepository.listTags).mockResolvedValue(mockResult);

      const result = await tagService.listTags({ limit: 10, offset: 0, query: "nature" });

      expect(tagRepository.listTags).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        query: "nature",
        tag: { key: "nature", value: undefined, type: "default" },
      });
      expect(result).toBe(mockResult);
    });
  });

  describe("initIdCache", () => {
    it("enumerates tags and initializes cache", async () => {
      vi.mocked(tagRepository.enumerateTags).mockResolvedValue([
        { id: 1, key: "nature", value: null, type: "default" },
        { id: 2, key: "uploaded", value: "01.01.2025", type: "meta" },
      ]);

      await tagService.initIdCache();

      expect(tagCache.init).toHaveBeenCalledWith([
        {
          tagId: "1",
          tag: { key: "nature", value: undefined, type: "default" },
        },
        {
          tagId: "2",
          tag: { key: "uploaded", value: "01.01.2025", type: "default" },
        },
      ]);
    });
  });
});
