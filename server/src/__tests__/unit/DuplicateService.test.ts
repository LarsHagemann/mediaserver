import { describe, it, expect, vi, beforeEach } from "vitest";
import { DuplicateService } from "../../duplicates/DuplicateService.js";
import type {
  DuplicateGroupMember,
  DuplicateRepository,
} from "../../duplicates/DuplicateRepository.js";
import type { FileService } from "../../files/FileService.js";
import { AccessScopeResolver } from "../../auth/AccessScopeResolver.js";
import type { LoggingService } from "../../common/LoggingService.js";
import type { Identity } from "../../auth/Identity.js";

const OWNER_USER_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";
const HASH = "a".repeat(64);

const makeMember = (
  id: string,
  overrides: Partial<DuplicateGroupMember> = {},
): DuplicateGroupMember => ({
  id,
  mime: "image/jpeg",
  friendlyName: `${id}.jpg`,
  ownerId: OWNER_USER_ID,
  ownerName: "Owner",
  isPublic: false,
  sizeBytes: 1000,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  tags: [],
  ...overrides,
});

const makeDuplicateRepository = (members: DuplicateGroupMember[]) =>
  ({
    listDuplicateGroups: vi.fn(),
    listGroupMembers: vi.fn().mockResolvedValue(new Map([[HASH, members]])),
    getFileLocations: vi.fn().mockResolvedValue(
      members.map((member) => ({
        id: member.id,
        base_path: "/data/storage",
        filename: `${member.id}.jpg`,
      })),
    ),
    mergeGroup: vi.fn(),
    listUnhashedDocuments: vi.fn(),
    countUnhashedDocuments: vi.fn().mockResolvedValue(0),
    setContentHash: vi.fn(),
  }) as unknown as DuplicateRepository;

const makeFileService = (): FileService =>
  ({
    removeDocumentFiles: vi.fn(),
    digestFile: vi.fn(),
  }) as unknown as FileService;

const makeLogger = (): LoggingService =>
  ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }) as unknown as LoggingService;

const makeIdentity = (
  userId: string | null,
  permissions: string[] = ["document:read"],
): Identity =>
  ({
    userId,
    isAuthenticated: userId !== null,
    permissions,
    hasPermission: (p: string) => permissions.includes(p),
  }) as unknown as Identity;

describe("DuplicateService", () => {
  let duplicateRepository: DuplicateRepository;
  let fileService: FileService;
  let service: DuplicateService;

  const members = [makeMember("doc-1"), makeMember("doc-2")];

  beforeEach(() => {
    duplicateRepository = makeDuplicateRepository(members);
    fileService = makeFileService();
    service = new DuplicateService(
      duplicateRepository,
      fileService,
      new AccessScopeResolver(),
      makeLogger(),
    );
  });

  const baseRequest = {
    contentHash: HASH,
    keepId: "doc-1",
    mergeIds: ["doc-2"],
    tagsToAdd: [],
    tagsToRemove: [],
  };

  describe("resolveDuplicateGroup", () => {
    it("merges the group and deletes the merged files", async () => {
      const result = await service.resolveDuplicateGroup(
        makeIdentity(OWNER_USER_ID),
        baseRequest,
      );

      expect(duplicateRepository.mergeGroup).toHaveBeenCalledWith(
        "doc-1",
        ["doc-2"],
        [],
        [],
      );
      expect(fileService.removeDocumentFiles).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        keptId: "doc-1",
        mergedCount: 1,
        reclaimedBytes: 1000,
      });
    });

    it("passes explicit tag edits through to the merge", async () => {
      const tagsToAdd = [
        { key: "reviewed", value: undefined, type: "default" },
      ];
      const tagsToRemove = [{ key: "todo", value: undefined, type: "default" }];

      await service.resolveDuplicateGroup(makeIdentity(OWNER_USER_ID), {
        ...baseRequest,
        tagsToAdd,
        tagsToRemove,
      });

      expect(duplicateRepository.mergeGroup).toHaveBeenCalledWith(
        "doc-1",
        ["doc-2"],
        tagsToAdd,
        tagsToRemove,
      );
    });

    it("scopes the lookup to documents the caller owns", async () => {
      await service.resolveDuplicateGroup(
        makeIdentity(OWNER_USER_ID),
        baseRequest,
      );

      expect(duplicateRepository.listGroupMembers).toHaveBeenCalledWith(
        [HASH],
        {
          type: "owned-by",
          userId: OWNER_USER_ID,
        },
      );
    });

    it("uses the unrestricted scope when user management is disabled", async () => {
      await service.resolveDuplicateGroup(makeIdentity("system"), baseRequest);

      expect(duplicateRepository.listGroupMembers).toHaveBeenCalledWith(
        [HASH],
        {
          type: "all",
        },
      );
    });

    it("rejects ids that are not part of the group", async () => {
      await expect(
        service.resolveDuplicateGroup(makeIdentity(OWNER_USER_ID), {
          ...baseRequest,
          mergeIds: ["doc-3"],
        }),
      ).rejects.toThrow(/not part of duplicate group/);

      expect(duplicateRepository.mergeGroup).not.toHaveBeenCalled();
    });

    it("rejects merging the kept document into itself", async () => {
      await expect(
        service.resolveDuplicateGroup(makeIdentity(OWNER_USER_ID), {
          ...baseRequest,
          mergeIds: ["doc-1"],
        }),
      ).rejects.toThrow(/cannot also be merged away/);

      expect(duplicateRepository.mergeGroup).not.toHaveBeenCalled();
    });

    it("rejects an empty merge list", async () => {
      await expect(
        service.resolveDuplicateGroup(makeIdentity(OWNER_USER_ID), {
          ...baseRequest,
          mergeIds: [],
        }),
      ).rejects.toThrow(/No documents given/);
    });

    it("refuses a group the caller cannot see", async () => {
      vi.mocked(duplicateRepository.listGroupMembers).mockResolvedValue(
        new Map(),
      );

      await expect(
        service.resolveDuplicateGroup(makeIdentity(OTHER_USER_ID), baseRequest),
      ).rejects.toThrow(/No resolvable duplicate group/);

      expect(duplicateRepository.mergeGroup).not.toHaveBeenCalled();
    });

    it("does not delete files when the merge itself fails", async () => {
      vi.mocked(duplicateRepository.mergeGroup).mockRejectedValue(
        new Error("constraint violation"),
      );

      await expect(
        service.resolveDuplicateGroup(makeIdentity(OWNER_USER_ID), baseRequest),
      ).rejects.toThrow();

      expect(fileService.removeDocumentFiles).not.toHaveBeenCalled();
    });
  });

  describe("startIndexing", () => {
    it("hashes every unindexed document exactly once", async () => {
      vi.mocked(duplicateRepository.listUnhashedDocuments)
        .mockResolvedValueOnce([
          { id: "doc-1", base_path: "/data/storage", filename: "doc-1.jpg" },
        ])
        .mockResolvedValue([]);
      vi.mocked(fileService.digestFile).mockResolvedValue({
        contentHash: HASH,
        sizeBytes: 1000,
      });

      await service.startIndexing();
      await vi.waitFor(async () => {
        expect((await service.getIndexingStatus()).running).toBe(false);
      });

      expect(fileService.digestFile).toHaveBeenCalledWith(
        "/data/storage/documents/doc-1.jpg",
      );
      expect(duplicateRepository.setContentHash).toHaveBeenCalledWith(
        "doc-1",
        HASH,
        1000,
      );
    });

    it("skips documents whose file cannot be read instead of looping forever", async () => {
      vi.mocked(duplicateRepository.listUnhashedDocuments).mockImplementation(
        async (_limit: number, excludeIds: string[] = []) =>
          excludeIds.includes("doc-1")
            ? []
            : [
                {
                  id: "doc-1",
                  base_path: "/data/storage",
                  filename: "missing.jpg",
                },
              ],
      );
      vi.mocked(fileService.digestFile).mockRejectedValue(
        new Error("ENOENT: no such file"),
      );

      await service.startIndexing();
      await vi.waitFor(async () => {
        expect((await service.getIndexingStatus()).running).toBe(false);
      });

      const status = await service.getIndexingStatus();
      expect(status.failed).toBe(1);
      expect(status.processed).toBe(0);
      expect(duplicateRepository.setContentHash).not.toHaveBeenCalled();
    });
  });
});
