import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../../documents/DocumentService.js";
import type { DocumentRepository } from "../../documents/DocumentRepository.js";
import type { TagService } from "../../tags/TagService.js";

vi.mock("fs/promises", () => ({
  stat: vi.fn().mockResolvedValue({ size: 1024 }),
}));

const makeDocumentRepository = (): DocumentRepository =>
  ({
    createDocument: vi.fn(),
    getDocumentWithPathInfo: vi.fn(),
  }) as unknown as DocumentRepository;

const makeTagService = (): TagService =>
  ({
    addTagToDocument: vi.fn(),
  }) as unknown as TagService;

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
      });

      expect(tagService.addTagToDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe("getDocumentThumbnail", () => {
    it("returns the thumbnail path", async () => {
      vi.mocked(documentRepository.getDocumentWithPathInfo).mockResolvedValue({
        id: "doc-1",
        mime: "image/jpeg",
        base_path: "/data/storage",
        filename: "photo.jpg",
        previousId: undefined,
        nextId: undefined,
        queryIndex: 0,
      });

      const result = await documentService.getDocumentThumbnail("doc-1");

      expect(result).toBe("/data/storage/thumbnails/doc-1.jpg");
    });
  });

  describe("getDocument", () => {
    beforeEach(() => {
      vi.mocked(documentRepository.getDocumentWithPathInfo).mockResolvedValue({
        id: "doc-1",
        mime: "image/jpeg",
        base_path: "/data/storage",
        filename: "photo.jpg",
        previousId: undefined,
        nextId: undefined,
        queryIndex: 0,
      });
    });

    it("returns FileDownload when no range header provided", async () => {
      const { FileDownload } = await import("../../ApiHandler.js");
      const result = await documentService.getDocument("doc-1", undefined);

      expect(result).toBeInstanceOf(FileDownload);
    });

    it("returns FileStream when range header is present", async () => {
      const { FileStream } = await import("../../ApiHandler.js");
      const result = await documentService.getDocument("doc-1", "bytes=0-511");

      expect(result).toBeInstanceOf(FileStream);
    });
  });
});
