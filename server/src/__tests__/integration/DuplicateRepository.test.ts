import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DuplicateRepository } from "../../duplicates/DuplicateRepository.js";
import { DocumentRepository } from "../../documents/DocumentRepository.js";
import { createTestDb } from "../helpers/testDb.js";
import type { DbService } from "../../sql/DbService.js";
import z from "zod";

describe("DuplicateRepository (integration)", () => {
  let dbService: DbService;
  let teardown: () => Promise<void>;
  let repository: DuplicateRepository;
  let documentRepository: DocumentRepository;

  const ALICE = "00000000-0000-0000-0000-0000000000a1";
  const BOB = "00000000-0000-0000-0000-0000000000b1";

  const HASH_SHARED = "a".repeat(64);
  const HASH_UNIQUE = "b".repeat(64);
  const HASH_CROSS_OWNER = "c".repeat(64);

  // Alice owns three copies of one file, plus an unrelated unique one.
  const ALICE_COPY_1 = "00000000-0000-0000-0000-000000000101";
  const ALICE_COPY_2 = "00000000-0000-0000-0000-000000000102";
  const ALICE_COPY_3 = "00000000-0000-0000-0000-000000000103";
  const ALICE_UNIQUE = "00000000-0000-0000-0000-000000000104";
  // Alice and Bob each hold a copy of the same file.
  const ALICE_CROSS = "00000000-0000-0000-0000-000000000105";
  const BOB_CROSS = "00000000-0000-0000-0000-000000000106";

  const seedDocument = async (
    id: string,
    ownerId: string,
    contentHash: string | null,
    isPublic = false,
  ) => {
    if (contentHash === null) {
      await dbService.none(
        `INSERT INTO documents (id, base_path, filename, friendly_name, mime, owner_id, is_public)
         VALUES ($id, '/data/storage', $filename, $filename, 'image/jpeg', $ownerId, $isPublic)`,
        { id, filename: `${id}.jpg`, ownerId, isPublic },
      );
      return;
    }
    await documentRepository.createDocument({
      id,
      basePath: "/data/storage",
      filename: `${id}.jpg`,
      friendlyName: `${id}.jpg`,
      type: "image/jpeg",
      ownerId,
      isPublic,
      contentHash,
      sizeBytes: 1000,
    });
  };

  beforeAll(async () => {
    ({ dbService, teardown } = await createTestDb());
    repository = new DuplicateRepository(dbService);
    documentRepository = new DocumentRepository(dbService);

    for (const [id, name] of [
      [ALICE, "Alice"],
      [BOB, "Bob"],
    ]) {
      await dbService.none(
        "INSERT INTO users (id, external_id, name) VALUES ($id, $externalId, $name)",
        { id, externalId: name!.toLowerCase(), name },
      );
    }
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await dbService.none("DELETE FROM userdata_tags");
    await dbService.none("DELETE FROM documents");

    await seedDocument(ALICE_COPY_1, ALICE, HASH_SHARED);
    await seedDocument(ALICE_COPY_2, ALICE, HASH_SHARED);
    await seedDocument(ALICE_COPY_3, ALICE, HASH_SHARED);
    await seedDocument(ALICE_UNIQUE, ALICE, HASH_UNIQUE);
    await seedDocument(ALICE_CROSS, ALICE, HASH_CROSS_OWNER, true);
    await seedDocument(BOB_CROSS, BOB, HASH_CROSS_OWNER, true);
  });

  describe("listDuplicateGroups", () => {
    it("groups documents by content hash and ignores unique files", async () => {
      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "owned-by", userId: ALICE },
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.contentHash).toBe(HASH_SHARED);
      expect(result.items[0]!.documentCount).toBe(3);
      expect(result.items[0]!.sizeBytes).toBe(1000);
      // Two of the three copies can go.
      expect(result.items[0]!.reclaimableBytes).toBe(2000);
      expect(result.items[0]!.documents.map((d) => d.id).sort()).toEqual(
        [ALICE_COPY_1, ALICE_COPY_2, ALICE_COPY_3].sort(),
      );
    });

    it("does not pair a user's document with another user's copy", async () => {
      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "owned-by", userId: ALICE },
      });

      expect(
        result.items.some((group) => group.contentHash === HASH_CROSS_OWNER),
      ).toBe(false);
    });

    it("sees every group across owners in the unrestricted scope", async () => {
      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "all" },
      });

      const hashes = result.items.map((group) => group.contentHash).sort();
      expect(hashes).toEqual([HASH_SHARED, HASH_CROSS_OWNER].sort());
    });

    it("returns nothing for the empty scope", async () => {
      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "none" },
      });

      expect(result).toEqual({ items: [], total: 0 });
    });

    it("reports the group total independently of the page size", async () => {
      const result = await repository.listDuplicateGroups({
        limit: 1,
        offset: 0,
        scope: { type: "all" },
      });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(1);
    });

    it("excludes documents that have not been hashed yet", async () => {
      await seedDocument("00000000-0000-0000-0000-000000000107", ALICE, null);
      await seedDocument("00000000-0000-0000-0000-000000000108", ALICE, null);

      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "owned-by", userId: ALICE },
      });

      expect(result.total).toBe(1);
      expect(result.items[0]!.contentHash).toBe(HASH_SHARED);
    });
  });

  describe("mergeGroup", () => {
    const tagsOf = async (documentId: string): Promise<string[]> => {
      const rows = await dbService.any(
        z.object({ key: z.string(), value: z.string().nullable() }),
        `SELECT t.key, t.value
         FROM userdata_tags ut
         JOIN tags t ON t.id = ut.tag_id
         WHERE ut.userdata_id = $documentId`,
        { documentId },
      );
      return rows
        .map((row) => (row.value ? `${row.key}:${row.value}` : row.key))
        .sort();
    };

    const addTag = async (
      documentId: string,
      key: string,
      value: string | null,
      type = "default",
    ) => {
      await dbService.none(
        `INSERT INTO tags (key, value, type) VALUES ($key, $value, $type)
         ON CONFLICT DO NOTHING`,
        { key, value, type },
      );
      await dbService.none(
        `INSERT INTO userdata_tags (userdata_id, tag_id)
         SELECT $documentId, id FROM tags
         WHERE key = $key AND value IS NOT DISTINCT FROM $value::text AND type = $type`,
        { documentId, key, value, type },
      );
    };

    it("unions the tags of every merged copy onto the keeper", async () => {
      await addTag(ALICE_COPY_1, "holiday", null);
      await addTag(ALICE_COPY_2, "beach", null);
      await addTag(ALICE_COPY_3, "year", "2026");

      await repository.mergeGroup(
        ALICE_COPY_1,
        [ALICE_COPY_2, ALICE_COPY_3],
        [],
        [],
      );

      expect(await tagsOf(ALICE_COPY_1)).toEqual([
        "beach",
        "holiday",
        "year:2026",
      ]);
    });

    it("preserves static collection membership, which is stored as a tag", async () => {
      await addTag(ALICE_COPY_2, "collection", "trip-2026", "collection");

      await repository.mergeGroup(ALICE_COPY_1, [ALICE_COPY_2], [], []);

      expect(await tagsOf(ALICE_COPY_1)).toContain("collection:trip-2026");
    });

    it("applies additions and removals on top of the union", async () => {
      await addTag(ALICE_COPY_1, "todo", null);
      await addTag(ALICE_COPY_2, "blurry", null);
      await dbService.none(
        "INSERT INTO tags (key, value, type) VALUES ('reviewed', NULL, 'default') ON CONFLICT DO NOTHING",
      );

      await repository.mergeGroup(
        ALICE_COPY_1,
        [ALICE_COPY_2],
        [{ key: "reviewed", value: undefined, type: "default" }],
        [
          { key: "todo", value: undefined, type: "default" },
          { key: "blurry", value: undefined, type: "default" },
        ],
      );

      expect(await tagsOf(ALICE_COPY_1)).toEqual(["reviewed"]);
    });

    it("deletes the merged documents and keeps the chosen one", async () => {
      await repository.mergeGroup(
        ALICE_COPY_1,
        [ALICE_COPY_2, ALICE_COPY_3],
        [],
        [],
      );

      const remaining = await dbService.any(
        z.object({ id: z.string() }),
        "SELECT id FROM documents WHERE content_hash = $hash",
        { hash: HASH_SHARED },
      );
      expect(remaining.map((row) => row.id)).toEqual([ALICE_COPY_1]);
    });

    it("leaves no duplicate group behind", async () => {
      await repository.mergeGroup(
        ALICE_COPY_1,
        [ALICE_COPY_2, ALICE_COPY_3],
        [],
        [],
      );

      const result = await repository.listDuplicateGroups({
        limit: 10,
        offset: 0,
        scope: { type: "owned-by", userId: ALICE },
      });
      expect(result.total).toBe(0);
    });
  });

  describe("backfill helpers", () => {
    it("counts and lists only documents without a hash", async () => {
      const unhashedId = "00000000-0000-0000-0000-000000000109";
      await seedDocument(unhashedId, ALICE, null);

      expect(await repository.countUnhashedDocuments()).toBe(1);

      const batch = await repository.listUnhashedDocuments(10);
      expect(batch.map((row) => row.id)).toEqual([unhashedId]);

      await repository.setContentHash(unhashedId, HASH_UNIQUE, 4096);

      expect(await repository.countUnhashedDocuments()).toBe(0);
    });

    it("skips excluded ids so a failing document cannot stall the run", async () => {
      const unhashedId = "00000000-0000-0000-0000-00000000010a";
      await seedDocument(unhashedId, ALICE, null);

      expect(await repository.listUnhashedDocuments(10, [unhashedId])).toEqual(
        [],
      );
    });
  });
});
