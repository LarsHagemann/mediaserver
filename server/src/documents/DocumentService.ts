import path from "path";
import type {
  CreateDocumentRequest,
  DocumentRepository,
} from "./DocumentRepository.js";
import type { TagService } from "../tags/TagService.js";
import { FileDownload, FileStream, parseRangeHeader } from "../ApiHandler.js";
import { stat } from "fs/promises";

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly tagService: TagService,
  ) {}

  public async createDocument(request: CreateDocumentRequest): Promise<void> {
    await this.documentRepository.createDocument(request);
    await this.tagService.addTagToDocument(
      request.id,
      `uploaded:${new Date().toLocaleDateString("de")}`,
      "meta",
    );
    await this.tagService.addTagToDocument(request.id, request.type, "meta");
    await this.tagService.addTagToDocument(
      request.id,
      request.type.replaceAll("/", ":"),
      "meta",
    );
  }

  public async getDocumentThumbnail(id: string): Promise<string> {
    const document = await this.documentRepository.getDocumentWithPathInfo(id);
    return path.join(document.base_path, "thumbnails", `${id}.jpg`);
  }

  public async getDocument(
    id: string,
    rangeHeader: string | undefined,
  ): Promise<FileDownload | FileStream> {
    const document = await this.documentRepository.getDocumentWithPathInfo(id);
    const filePath = path.join(
      document.base_path,
      "documents",
      document.filename,
    );

    const documentSize = (await stat(filePath)).size;
    const range = parseRangeHeader(rangeHeader ?? "", documentSize);

    if (!range) {
      return new FileDownload(filePath, document.mime);
    } else {
      return new FileStream(
        filePath,
        document.mime,
        document.filename,
        range.start,
        range.end,
        documentSize,
      );
    }
  }
}
