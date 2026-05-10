import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../../documents/DocumentService.js";
import type { DocumentRepository } from "../../documents/DocumentRepository.js";
import type { TagService } from "../../tags/TagService.js";

vi.mock("fs/promises", () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}));

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

const makeDocumentRepository = (): DocumentRepository =>
  ({
    createDocument: vi.fn(),
    getDocumentWithPathInfo: vi.fn(),
    getDocumentAccess: vi.fn(),
    updateDocumentAccess: vi.fn(),
    deleteDocument: vi.fn(),
  }) as unknown as DocumentRepository;

const makeTagService = (): TagService =>
  ({
    addTagToDocument: vi.fn(),
  }) as unknown as TagService;

const mockDocWithPathInfo = {
  id: "doc-1",
  mime: "image/jpeg",
  base_path: "/data/storage",
  filename: "photo.jpg",
  ownerId: SYSTEM_USER_ID,
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
        type: "image/jpeg",
        ownerId: SYSTEM_USER_ID,
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
        type: "video/mp4",
        ownerId: SYSTEM_USER_ID,
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
});
