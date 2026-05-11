import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../../documents/DocumentService.js";
import type { DocumentRepository } from "../../documents/DocumentRepository.js";
import type { TagService } from "../../tags/TagService.js";
import type { Identity } from "../../auth/Identity.js";

vi.mock("fs/promises", () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}));

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const OWNER_USER_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";

const makeDocumentRepository = (): DocumentRepository =>
  ({
    createDocument: vi.fn(),
    getDocumentWithPathInfo: vi.fn(),
    getDocumentAccess: vi.fn(),
    updateDocumentAccess: vi.fn(),
    updateFriendlyName: vi.fn(),
    deleteDocument: vi.fn(),
  }) as unknown as DocumentRepository;

const makeTagService = (): TagService =>
  ({
    addTagToDocument: vi.fn(),
  }) as unknown as TagService;

const makeIdentity = (userId: string | null, permissions: string[] = []): Identity =>
  ({
    userId,
    hasPermission: (p: string) => permissions.includes(p),
  }) as unknown as Identity;

const mockDocWithPathInfo = {
  id: "doc-1",
  mime: "image/jpeg",
  base_path: "/data/storage",
  filename: "photo.jpg",
  friendlyName: "My Photo",
  ownerId: OWNER_USER_ID,
  isPublic: true,
  previousId: undefined,
  nextId: undefined,
  queryIndex: 0,
};

describe("DocumentService", () => {
  let documentRepository: ReturnType<typeof makeDocumentRepository>;
  let tagService: ReturnType<typeof makeTagService>;
  let documentService: DocumentService;

  beforeEach(() => {
    documentRepository = makeDocumentRepository();
    tagService = makeTagService();
    documentService = new DocumentService(documentRepository, tagService);
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("creates the document and adds meta tags", async () => {
      const request = {
        id: "doc-1",
        basePath: "/data",
        filename: "photo.jpg",
        friendlyName: "photo.jpg",
        type: "image/jpeg",
        ownerId: SYSTEM_USER_ID,
        isPublic: false,
      };

      await documentService.createDocument(request);

      expect(documentRepository.createDocument).toHaveBeenCalledWith(request);
      expect(tagService.addTagToDocument).toHaveBeenCalledWith(
        "doc-1",
        expect.stringMatching(/^uploaded:/),
        "meta",
      );
      expect(tagService.addTagToDocument).toHaveBeenCalledWith("doc-1", "image/jpeg", "meta");
      expect(tagService.addTagToDocument).toHaveBeenCalledWith("doc-1", "image:jpeg", "meta");
    });

    it("adds three meta tags total", async () => {
      await documentService.createDocument({
        id: "doc-2",
        basePath: "/data",
        filename: "video.mp4",
        friendlyName: "video.mp4",
        type: "video/mp4",
        ownerId: SYSTEM_USER_ID,
        isPublic: false,
      });

      expect(tagService.addTagToDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe("getDocumentThumbnail", () => {
    it("returns the thumbnail path", async () => {
      vi.mocked(documentRepository.getDocumentWithPathInfo).mockResolvedValue(mockDocWithPathInfo);

      const result = await documentService.getDocumentThumbnail("doc-1", { type: "all" });

      expect(result).toBe("/data/storage/thumbnails/doc-1.jpg");
    });
  });

  describe("getDocument", () => {
    beforeEach(() => {
      vi.mocked(documentRepository.getDocumentWithPathInfo).mockResolvedValue(mockDocWithPathInfo);
    });

    it("returns FileDownload when no range header provided", async () => {
      const { FileDownload } = await import("../../ApiHandler.js");
      const result = await documentService.getDocument("doc-1", undefined, { type: "all" });

      expect(result).toBeInstanceOf(FileDownload);
    });

    it("returns FileStream when range header is present", async () => {
      const { FileStream } = await import("../../ApiHandler.js");
      const result = await documentService.getDocument("doc-1", "bytes=0-511", { type: "all" });

      expect(result).toBeInstanceOf(FileStream);
    });
  });

  describe("updateFriendlyName", () => {
    beforeEach(() => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: OWNER_USER_ID,
        isPublic: true,
        shares: [],
      });
    });

    it("allows owner to update friendly name", async () => {
      const identity = makeIdentity(OWNER_USER_ID);

      await documentService.updateFriendlyName("doc-1", identity, "New Name");

      expect(documentRepository.updateFriendlyName).toHaveBeenCalledWith("doc-1", "New Name");
    });

    it("allows admin to update friendly name", async () => {
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      await documentService.updateFriendlyName("doc-1", identity, "Admin Name");

      expect(documentRepository.updateFriendlyName).toHaveBeenCalledWith("doc-1", "Admin Name");
    });

    it("rejects non-owner without admin permission", async () => {
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        documentService.updateFriendlyName("doc-1", identity, "Stolen Name"),
      ).rejects.toThrow();

      expect(documentRepository.updateFriendlyName).not.toHaveBeenCalled();
    });
  });

  describe("getDocumentAccess", () => {
    beforeEach(() => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: OWNER_USER_ID,
        isPublic: true,
        shares: [],
      });
    });

    it("allows owner to get access info", async () => {
      const identity = makeIdentity(OWNER_USER_ID);

      const result = await documentService.getDocumentAccess("doc-1", identity);

      expect(result.ownerId).toBe(OWNER_USER_ID);
    });

    it("allows admin to get access info", async () => {
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      const result = await documentService.getDocumentAccess("doc-1", identity);

      expect(result.ownerId).toBe(OWNER_USER_ID);
    });

    it("rejects non-owner without admin permission", async () => {
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        documentService.getDocumentAccess("doc-1", identity),
      ).rejects.toThrow();
    });

    it("rejects system identity (not an owner) for user-owned document", async () => {
      const identity = makeIdentity("system");

      await expect(
        documentService.getDocumentAccess("doc-1", identity),
      ).rejects.toThrow();
    });

    it("rejects regular user from system-owned document access info", async () => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: SYSTEM_USER_ID,
        isPublic: false,
        shares: [],
      });
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        documentService.getDocumentAccess("doc-1", identity),
      ).rejects.toThrow();
    });

    it("allows admin to get access info for system-owned document", async () => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: SYSTEM_USER_ID,
        isPublic: false,
        shares: [],
      });
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      const result = await documentService.getDocumentAccess("doc-1", identity);

      expect(result.ownerId).toBe(SYSTEM_USER_ID);
    });
  });

  describe("updateDocumentAccess", () => {
    const update = { isPublic: false, sharedWith: [] };

    beforeEach(() => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: OWNER_USER_ID,
        isPublic: true,
        shares: [],
      });
      vi.mocked(documentRepository.updateDocumentAccess).mockResolvedValue(undefined);
    });

    it("allows owner to update access", async () => {
      const identity = makeIdentity(OWNER_USER_ID);

      await documentService.updateDocumentAccess("doc-1", identity, update);

      expect(documentRepository.updateDocumentAccess).toHaveBeenCalledWith("doc-1", update);
    });

    it("allows admin to update access", async () => {
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      await documentService.updateDocumentAccess("doc-1", identity, update);

      expect(documentRepository.updateDocumentAccess).toHaveBeenCalledWith("doc-1", update);
    });

    it("rejects non-owner without admin permission", async () => {
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        documentService.updateDocumentAccess("doc-1", identity, update),
      ).rejects.toThrow();

      expect(documentRepository.updateDocumentAccess).not.toHaveBeenCalled();
    });

    it("rejects null userId (anonymous) from updating access", async () => {
      const identity = makeIdentity(null);

      await expect(
        documentService.updateDocumentAccess("doc-1", identity, update),
      ).rejects.toThrow();

      expect(documentRepository.updateDocumentAccess).not.toHaveBeenCalled();
    });

    it("rejects regular user from updating system-owned document access", async () => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: SYSTEM_USER_ID,
        isPublic: true,
        shares: [],
      });
      const identity = makeIdentity(OTHER_USER_ID);

      await expect(
        documentService.updateDocumentAccess("doc-1", identity, update),
      ).rejects.toThrow();

      expect(documentRepository.updateDocumentAccess).not.toHaveBeenCalled();
    });

    it("allows admin to update system-owned document access", async () => {
      vi.mocked(documentRepository.getDocumentAccess).mockResolvedValue({
        ownerId: SYSTEM_USER_ID,
        isPublic: true,
        shares: [],
      });
      const identity = makeIdentity(OTHER_USER_ID, ["admin:users"]);

      await documentService.updateDocumentAccess("doc-1", identity, update);

      expect(documentRepository.updateDocumentAccess).toHaveBeenCalledWith("doc-1", update);
    });
  });
});
