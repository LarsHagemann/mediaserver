import path from "path";
import type {
  CreateDocumentRequest,
  DocumentAccess,
  DocumentRepository,
} from "./DocumentRepository.js";
import type { TagService } from "../tags/TagService.js";
import { FileDownload, FileStream, parseRangeHeader } from "../ApiHandler.js";
import { ApiError } from "../common/ApiError.js";
import { stat } from "fs/promises";
import type { Identity } from "../auth/Identity.js";
import type { DocumentAccessScope } from "../auth/AccessScope.js";
import type { FileService } from "../files/FileService.js";

export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly tagService: TagService,
    private readonly fileService: FileService,
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

  public async updateFriendlyName(
    documentId: string,
    identity: Identity,
    friendlyName: string,
  ): Promise<void> {
    const access = await this.documentRepository.getDocumentAccess(documentId);
    if (!canManageAccess(identity, access.ownerId)) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the document owner or an admin can update the document name",
      );
    }
    await this.documentRepository.updateFriendlyName(documentId, friendlyName);
  }

  public async getDocumentThumbnail(
    id: string,
    scope: DocumentAccessScope,
  ): Promise<string> {
    const document = await this.documentRepository.getDocumentWithPathInfo(
      id,
      scope,
    );
    return path.join(document.base_path, "thumbnails", `${id}.jpg`);
  }

  public async getDocument(
    id: string,
    rangeHeader: string | undefined,
    scope: DocumentAccessScope,
  ): Promise<FileDownload | FileStream> {
    const document = await this.documentRepository.getDocumentWithPathInfo(
      id,
      scope,
    );
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

  public async getDocumentAccess(
    documentId: string,
    identity: Identity,
  ): Promise<DocumentAccess> {
    const access = await this.documentRepository.getDocumentAccess(documentId);
    if (!canManageAccess(identity, access.ownerId)) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the document owner or an admin can manage access",
      );
    }
    return access;
  }

  public async updateDocumentAccess(
    documentId: string,
    identity: Identity,
    update: { isPublic: boolean; sharedWith: string[] },
  ): Promise<void> {
    const access = await this.documentRepository.getDocumentAccess(documentId);
    if (!canManageAccess(identity, access.ownerId)) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the document owner or an admin can manage access",
      );
    }
    await this.documentRepository.updateDocumentAccess(documentId, update);
  }

  public async deleteDocument(
    documentId: string,
    identity: Identity,
  ): Promise<void> {
    const access = await this.documentRepository.getDocumentAccess(documentId);
    const isOwner = isDocumentOwner(identity, access.ownerId);
    if (!isOwner && !identity.hasPermission("document:delete")) {
      throw new ApiError(
        "Forbidden",
        403,
        "Only the document owner or a user with delete permission can delete documents",
      );
    }

    // Read the on-disk location before the row disappears, then drop the row
    // first and the files second. The reverse order would leave rows pointing
    // at missing files (broken downloads and thumbnails) if the second step
    // failed, whereas this order leaves at worst an unreferenced blob.
    const document =
      await this.documentRepository.getDocumentWithPathInfo(documentId);
    await this.documentRepository.deleteDocument(documentId);
    await this.fileService.removeDocumentFiles(
      document.base_path,
      document.filename,
      documentId,
    );
  }
}

function isDocumentOwner(identity: Identity, ownerId: string): boolean {
  return (
    identity.userId !== null &&
    identity.userId !== "system" &&
    identity.userId === ownerId
  );
}

function canManageAccess(identity: Identity, ownerId: string): boolean {
  return (
    isDocumentOwner(identity, ownerId) || identity.hasPermission("admin:users")
  );
}
