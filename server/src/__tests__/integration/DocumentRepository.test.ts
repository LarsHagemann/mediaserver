import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DocumentRepository } from "../../documents/DocumentRepository.js";
import { createTestDb } from "../helpers/testDb.js";
import type { DbService } from "../../sql/DbService.js";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

describe("DocumentRepository (integration)", () => {
  let container: StartedPostgreSqlContainer;
  let dbService: DbService;
  let teardown: () => Promise<void>;
  let repository: DocumentRepository;

  beforeAll(async () => {
    ({ container, dbService, teardown } = await createTestDb());
    repository = new DocumentRepository(dbService);
  });

  afterAll(async () => {
    await teardown();
  });

  const systemUserId = "00000000-0000-0000-0000-000000000000";

  describe("createDocument", () => {
    it("inserts a document without error", async () => {
      await expect(
        repository.createDocument({
          id: "00000000-0000-0000-0000-000000000001",
          basePath: "/data/storage",
          filename: "photo.jpg",
          friendlyName: "photo.jpg",
          type: "image/jpeg",
          ownerId: systemUserId,
          isPublic: true,
        }),
      ).resolves.toBeUndefined();
    });

    it("does not allow duplicate IDs", async () => {
      await repository.createDocument({
        id: "00000000-0000-0000-0000-000000000002",
        basePath: "/data/storage",
        filename: "duplicate.jpg",
        friendlyName: "duplicate.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: true,
      });

      await expect(
        repository.createDocument({
          id: "00000000-0000-0000-0000-000000000002",
          basePath: "/data/storage",
          filename: "duplicate.jpg",
          friendlyName: "duplicate.jpg",
          type: "image/jpeg",
          ownerId: systemUserId,
          isPublic: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe("getDocumentWithPathInfo", () => {
    it("returns the document that was created", async () => {
      const id = "00000000-0000-0000-0000-000000000003";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "test.jpg",
        friendlyName: "My Test Photo",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: true,
      });

      const result = await repository.getDocumentWithPathInfo(id);

      expect(result).toMatchObject({
        id,
        mime: "image/jpeg",
        base_path: "/data/storage",
        filename: "test.jpg",
        friendlyName: "My Test Photo",
        ownerId: systemUserId,
        isPublic: true,
        previousId: undefined,
        nextId: undefined,
        queryIndex: 0,
      });
    });

    it("throws when document does not exist", async () => {
      await expect(
        repository.getDocumentWithPathInfo("00000000-0000-0000-0000-999999999999"),
      ).rejects.toThrow();
    });
  });

  describe("updateFriendlyName", () => {
    it("updates the friendly name", async () => {
      const id = "00000000-0000-0000-0000-000000000010";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "rename-me.jpg",
        friendlyName: "Original Name",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: true,
      });

      await repository.updateFriendlyName(id, "Updated Name");

      const result = await repository.getDocumentWithPathInfo(id);
      expect(result.friendlyName).toBe("Updated Name");
    });
  });

  describe("ownerId", () => {
    it("stores and returns the correct ownerId", async () => {
      const id = "00000000-0000-0000-0000-000000000020";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "owned.jpg",
        friendlyName: "owned.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: false,
      });

      const result = await repository.getDocumentWithPathInfo(id);
      expect(result.ownerId).toBe(systemUserId);
    });
  });

  describe("isPublic", () => {
    it("stores private flag correctly", async () => {
      const id = "00000000-0000-0000-0000-000000000030";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "private.jpg",
        friendlyName: "private.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: false,
      });

      const result = await repository.getDocumentWithPathInfo(id);
      expect(result.isPublic).toBe(false);
    });

    it("stores public flag correctly", async () => {
      const id = "00000000-0000-0000-0000-000000000031";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "public.jpg",
        friendlyName: "public.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: true,
      });

      const result = await repository.getDocumentWithPathInfo(id);
      expect(result.isPublic).toBe(true);
    });

    it("hides private documents from public-only scope", async () => {
      const id = "00000000-0000-0000-0000-000000000032";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "hidden.jpg",
        friendlyName: "hidden.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: false,
      });

      await expect(
        repository.getDocumentWithPathInfo(id, { type: "public-only" }),
      ).rejects.toThrow();
    });

    it("exposes public documents via public-only scope", async () => {
      const id = "00000000-0000-0000-0000-000000000033";
      await repository.createDocument({
        id,
        basePath: "/data/storage",
        filename: "visible.jpg",
        friendlyName: "visible.jpg",
        type: "image/jpeg",
        ownerId: systemUserId,
        isPublic: true,
      });

      const result = await repository.getDocumentWithPathInfo(id, { type: "public-only" });
      expect(result.id).toBe(id);
    });
  });
});
