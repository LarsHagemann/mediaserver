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

  describe("createDocument", () => {
    it("inserts a document without error", async () => {
      await expect(
        repository.createDocument({
          id: "00000000-0000-0000-0000-000000000001",
          basePath: "/data/storage",
          filename: "photo.jpg",
          type: "image/jpeg",
        }),
      ).resolves.toBeUndefined();
    });

    it("does not allow duplicate IDs", async () => {
      await repository.createDocument({
        id: "00000000-0000-0000-0000-000000000002",
        basePath: "/data/storage",
        filename: "duplicate.jpg",
        type: "image/jpeg",
      });

      await expect(
        repository.createDocument({
          id: "00000000-0000-0000-0000-000000000002",
          basePath: "/data/storage",
          filename: "duplicate.jpg",
          type: "image/jpeg",
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
        type: "image/jpeg",
      });

      const result = await repository.getDocumentWithPathInfo(id);

      expect(result).toMatchObject({
        id,
        mime: "image/jpeg",
        base_path: "/data/storage",
        filename: "test.jpg",
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
});
