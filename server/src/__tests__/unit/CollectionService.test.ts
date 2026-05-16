import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionService } from "../../collections/CollectionService.js";
import type {
  Collection,
  CollectionRepository,
} from "../../collections/CollectionRepository.js";
import type { TagService } from "../../tags/TagService.js";
import type { Identity } from "../../auth/Identity.js";
import { ApiError } from "../../common/ApiError.js";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const OWNER_USER_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";

const makeIdentity = (userId: string | null, permissions: string[] = []): Identity =>
  ({
    userId,
    hasPermission: (p: string) => permissions.includes(p),
  }) as unknown as Identity;

const makeCollection = (overrides: Partial<Collection> = {}): Collection => ({
  id: "col-1",
  name: "My Collection",
  description: undefined,
  filterExpression: "nature",
  isFavorite: false,
  type: "dynamic",
  ownerId: OWNER_USER_ID,
  isPublic: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  ...overrides,
});

const makeCollectionAccess = (ownerId: string) => ({
  ownerId,
  isPublic: true,
  shares: [],
});

const makeCollectionRepository = (): CollectionRepository =>
  ({
    listCollections: vi.fn(),
    getCollection: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
    getCollectionAccess: vi.fn(),
    updateCollectionAccess: vi.fn(),
  }) as unknown as CollectionRepository;

const makeTagService = (): TagService =>
  ({
    addTagToDocument: vi.fn(),
    removeTagFromDocument: vi.fn(),
    deleteTag: vi.fn(),
  }) as unknown as TagService;

describe("CollectionService", () => {
  let collectionRepository: ReturnType<typeof makeCollectionRepository>;
  let tagService: ReturnType<typeof makeTagService>;
  let collectionService: CollectionService;

  beforeEach(() => {
    collectionRepository = makeCollectionRepository();
    tagService = makeTagService();
    collectionService = new CollectionService(collectionRepository, tagService);
  });

  describe("getCollection", () => {
    it("returns collection when found", async () => {
      const collection = makeCollection();
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(collection);

      const result = await collectionService.getCollection("col-1");

      expect(result).toBe(collection);
    });

    it("throws ApiError with 404 when not found", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(null);

      await expect(collectionService.getCollection("missing")).rejects.toThrow(
        new ApiError("CollectionNotFound", 404, "Collection missing not found"),
      );
    });
  });

  describe("createCollection", () => {
    it("creates a dynamic collection with given filter expression", async () => {
      const collection = makeCollection({ type: "dynamic" });
      vi.mocked(collectionRepository.createCollection).mockResolvedValue(collection);

      const result = await collectionService.createCollection({
        name: "My Collection",
        filterExpression: "nature",
        isFavorite: false,
        type: "dynamic",
      });

      expect(collectionRepository.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "My Collection",
          filterExpression: "nature",
          type: "dynamic",
        }),
      );
      expect(result).toBe(collection);
    });

    it("overrides filter expression for static collections", async () => {
      const collection = makeCollection({ type: "static" });
      vi.mocked(collectionRepository.createCollection).mockResolvedValue(collection);

      await collectionService.createCollection({
        name: "Static",
        filterExpression: "ignored",
        isFavorite: false,
        type: "static",
      });

      expect(collectionRepository.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "static",
          filterExpression: expect.stringMatching(/^collection:/),
        }),
      );
    });

    it("throws ApiError on invalid filter expression", async () => {
      await expect(
        collectionService.createCollection({
          name: "Bad",
          filterExpression: "((invalid",
          isFavorite: false,
          type: "dynamic",
        }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe("updateCollection", () => {
    it("updates a dynamic collection", async () => {
      const existing = makeCollection({ type: "dynamic" });
      const updated = makeCollection({ name: "Updated" });
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(existing);
      vi.mocked(collectionRepository.updateCollection).mockResolvedValue(updated);

      const result = await collectionService.updateCollection({
        id: "col-1",
        name: "Updated",
        description: null,
        filterExpression: "nature",
        isFavorite: false,
      });

      expect(result).toBe(updated);
    });

    it("overrides filter expression for static collections on update", async () => {
      const existing = makeCollection({ type: "static" });
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(existing);
      vi.mocked(collectionRepository.updateCollection).mockResolvedValue(existing);

      await collectionService.updateCollection({
        id: "col-1",
        name: "Static",
        description: null,
        filterExpression: "should-be-overridden",
        isFavorite: false,
      });

      expect(collectionRepository.updateCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          filterExpression: "collection:col-1",
        }),
      );
    });

    it("throws ApiError with 404 when update returns null", async () => {
      const existing = makeCollection({ type: "dynamic" });
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(existing);
      vi.mocked(collectionRepository.updateCollection).mockResolvedValue(null);

      await expect(
        collectionService.updateCollection({
          id: "col-1",
          name: "Updated",
          description: null,
          filterExpression: "nature",
          isFavorite: false,
        }),
      ).rejects.toThrow(new ApiError("CollectionNotFound", 404, "Collection col-1 not found"));
    });
  });

  describe("deleteCollection", () => {
    it("deletes a dynamic collection without deleting tags", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ type: "dynamic" }),
      );

      await collectionService.deleteCollection("col-1");

      expect(tagService.deleteTag).not.toHaveBeenCalled();
      expect(collectionRepository.deleteCollection).toHaveBeenCalledWith("col-1");
    });

    it("deletes tags when deleting a static collection", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ id: "col-1", type: "static" }),
      );

      await collectionService.deleteCollection("col-1");

      expect(tagService.deleteTag).toHaveBeenCalledWith("collection", "col-1");
      expect(collectionRepository.deleteCollection).toHaveBeenCalledWith("col-1");
    });
  });

  describe("addMember", () => {
    it("adds a tag to a document for a static collection", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ id: "col-1", type: "static" }),
      );

      await collectionService.addMember("col-1", "doc-1");

      expect(tagService.addTagToDocument).toHaveBeenCalledWith(
        "doc-1",
        "collection:col-1",
        "collection",
      );
    });

    it("throws ApiError when adding member to a dynamic collection", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ type: "dynamic" }),
      );

      await expect(collectionService.addMember("col-1", "doc-1")).rejects.toThrow(
        new ApiError("InvalidOperation", 400, "Cannot add members to a dynamic collection"),
      );
    });
  });

  describe("removeMember", () => {
    it("removes a tag from a document for a static collection", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ id: "col-1", type: "static" }),
      );

      await collectionService.removeMember("col-1", "doc-1");

      expect(tagService.removeTagFromDocument).toHaveBeenCalledWith(
        "doc-1",
        "collection:col-1",
      );
    });

    it("throws ApiError when removing member from a dynamic collection", async () => {
      vi.mocked(collectionRepository.getCollection).mockResolvedValue(
        makeCollection({ type: "dynamic" }),
      );

      await expect(collectionService.removeMember("col-1", "doc-1")).rejects.toThrow(
        new ApiError(
          "InvalidOperation",
          400,
          "Cannot remove members from a dynamic collection",
        ),
      );
    });
  });

  describe("getCollectionAccess", () => {
    beforeEach(() => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(OWNER_USER_ID),
      );
    });

    it("allows owner to get access info", async () => {
      const identity = makeIdentity(OWNER_USER_ID);

      const result = await collectionService.getCollectionAccess("col-1", identity);

      expect(result.ownerId).toBe(OWNER_USER_ID);
    });

    it("allows admin to get access info", async () => {
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      const result = await collectionService.getCollectionAccess("col-1", identity);

      expect(result.ownerId).toBe(OWNER_USER_ID);
    });

    it("rejects non-owner without admin permission", async () => {
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        collectionService.getCollectionAccess("col-1", identity),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });
    });

    it("rejects system identity (not an owner) for user-owned collection", async () => {
      const identity = makeIdentity("system");

      await expect(
        collectionService.getCollectionAccess("col-1", identity),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });
    });

    it("rejects regular user from system-owned collection", async () => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(SYSTEM_USER_ID),
      );
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        collectionService.getCollectionAccess("col-1", identity),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });
    });

    it("allows admin to get access info for system-owned collection", async () => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(SYSTEM_USER_ID),
      );
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      const result = await collectionService.getCollectionAccess("col-1", identity);

      expect(result.ownerId).toBe(SYSTEM_USER_ID);
    });
  });

  describe("updateCollectionAccess", () => {
    const update = { isPublic: false, sharedWith: [] };

    beforeEach(() => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(OWNER_USER_ID),
      );
      vi.mocked(collectionRepository.updateCollectionAccess).mockResolvedValue(undefined);
    });

    it("allows owner to update access", async () => {
      const identity = makeIdentity(OWNER_USER_ID);

      await collectionService.updateCollectionAccess("col-1", identity, update);

      expect(collectionRepository.updateCollectionAccess).toHaveBeenCalledWith("col-1", update);
    });

    it("allows admin to update access", async () => {
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      await collectionService.updateCollectionAccess("col-1", identity, update);

      expect(collectionRepository.updateCollectionAccess).toHaveBeenCalledWith("col-1", update);
    });

    it("rejects non-owner without admin permission", async () => {
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        collectionService.updateCollectionAccess("col-1", identity, update),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });

      expect(collectionRepository.updateCollectionAccess).not.toHaveBeenCalled();
    });

    it("rejects null userId (anonymous) from updating access", async () => {
      const identity = makeIdentity(null);

      await expect(
        collectionService.updateCollectionAccess("col-1", identity, update),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });

      expect(collectionRepository.updateCollectionAccess).not.toHaveBeenCalled();
    });

    it("rejects regular user from updating system-owned collection access", async () => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(SYSTEM_USER_ID),
      );
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        collectionService.updateCollectionAccess("col-1", identity, update),
      ).rejects.toMatchObject({ name: "Forbidden", status: 403 });

      expect(collectionRepository.updateCollectionAccess).not.toHaveBeenCalled();
    });

    it("allows admin to update system-owned collection access", async () => {
      vi.mocked(collectionRepository.getCollectionAccess).mockResolvedValue(
        makeCollectionAccess(SYSTEM_USER_ID),
      );
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      await collectionService.updateCollectionAccess("col-1", identity, update);

      expect(collectionRepository.updateCollectionAccess).toHaveBeenCalledWith("col-1", update);
    });
  });
});
