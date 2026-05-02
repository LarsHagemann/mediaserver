import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { CollectionRepository } from "../../collections/CollectionRepository.js";
import { createTestDb } from "../helpers/testDb.js";
import type { DbService } from "../../sql/DbService.js";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

describe("CollectionRepository (integration)", () => {
  let container: StartedPostgreSqlContainer;
  let dbService: DbService;
  let teardown: () => Promise<void>;
  let repository: CollectionRepository;

  beforeAll(async () => {
    ({ container, dbService, teardown } = await createTestDb());
    repository = new CollectionRepository(dbService);
  });

  afterAll(async () => {
    await teardown();
  });

  const baseRequest = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Test Collection",
    filterExpression: "nature",
    isFavorite: false,
    type: "dynamic" as const,
  };

  describe("createCollection", () => {
    it("creates and returns a collection", async () => {
      const result = await repository.createCollection(baseRequest);

      expect(result).toMatchObject({
        id: baseRequest.id,
        name: "Test Collection",
        filterExpression: "nature",
        isFavorite: false,
        type: "dynamic",
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("stores description when provided", async () => {
      const result = await repository.createCollection({
        id: "00000000-0000-0000-0000-000000000002",
        name: "With Description",
        description: "A test description",
        filterExpression: "nature",
        isFavorite: true,
        type: "dynamic",
      });

      expect(result.description).toBe("A test description");
      expect(result.isFavorite).toBe(true);
    });
  });

  describe("getCollection", () => {
    it("returns the collection by id", async () => {
      const result = await repository.getCollection(baseRequest.id);

      expect(result).toMatchObject({ id: baseRequest.id, name: "Test Collection" });
    });

    it("returns null for unknown id", async () => {
      const result = await repository.getCollection("00000000-0000-0000-0000-999999999999");

      expect(result).toBeNull();
    });
  });

  describe("listCollections", () => {
    it("returns all collections with total", async () => {
      const result = await repository.listCollections({ limit: 100, offset: 0, type: undefined });

      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by type", async () => {
      const result = await repository.listCollections({
        limit: 100,
        offset: 0,
        type: "dynamic",
      });

      expect(result.items.every((c) => c.type === "dynamic")).toBe(true);
    });

    it("respects limit and offset", async () => {
      const page1 = await repository.listCollections({ limit: 1, offset: 0, type: undefined });
      const page2 = await repository.listCollections({ limit: 1, offset: 1, type: undefined });

      expect(page1.items).toHaveLength(1);
      expect(page2.items).toHaveLength(1);
      expect(page1.items[0]!.id).not.toBe(page2.items[0]!.id);
    });
  });

  describe("updateCollection", () => {
    it("updates and returns the modified collection", async () => {
      const result = await repository.updateCollection({
        id: baseRequest.id,
        name: "Updated Name",
        description: "New desc",
        filterExpression: "updated",
        isFavorite: true,
      });

      expect(result).toMatchObject({
        id: baseRequest.id,
        name: "Updated Name",
        description: "New desc",
        filterExpression: "updated",
        isFavorite: true,
      });
    });

    it("returns null for unknown id", async () => {
      const result = await repository.updateCollection({
        id: "00000000-0000-0000-0000-999999999999",
        name: "Unknown",
        description: null,
        filterExpression: "x",
        isFavorite: false,
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteCollection", () => {
    it("removes the collection", async () => {
      const toDelete = await repository.createCollection({
        id: "00000000-0000-0000-0000-000000000003",
        name: "To Delete",
        filterExpression: "x",
        isFavorite: false,
        type: "dynamic",
      });

      await repository.deleteCollection(toDelete.id);

      const result = await repository.getCollection(toDelete.id);
      expect(result).toBeNull();
    });

    it("does not throw when deleting non-existent id", async () => {
      await expect(
        repository.deleteCollection("00000000-0000-0000-0000-999999999998"),
      ).resolves.toBeUndefined();
    });
  });
});
