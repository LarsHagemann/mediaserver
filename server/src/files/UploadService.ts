import { ApiError } from "../common/ApiError.js";
import type { DocumentService } from "../documents/DocumentService.js";
import { getFileTypePluginByType } from "../plugins/fileTypes.js";
import type { ApiTag } from "../tags/TagRepository.js";
import type { TagService } from "../tags/TagService.js";
import { tagToString } from "../util/tag.js";
import type { WebSocketService } from "../websocket/WebSocketService.js";
import type { FileService } from "./FileService.js";

type ProcessUploadDocument = {
  name: string;
  file: string;
  size: number;
  mimeType: string;
  extension: string;
  webSocketClientId: string;
  tags: ApiTag[];
  ownerId: string;
};

type UploadFinishedMessage = {
  file: string;
  id: string;
  basePath: string;
  filename: string;
  mimeType: string;
  webSocketClientId: string;
};

type UploadFailedMessage = {
  file: string;
  webSocketClientId: string;
  reason: string;
};

export class UploadService {
  constructor(
    private readonly fileService: FileService,
    private readonly documentService: DocumentService,
    private readonly tagService: TagService,
    private readonly webSocketServer: WebSocketService,
  ) {}

  async processUploadDocument(upload: ProcessUploadDocument): Promise<void> {
    try {
      const { id, basePath, filename } = await this.fileService.moveDocument(
        upload.file,
        upload.mimeType,
        upload.extension,
        upload.size,
      );

      await this.documentService.createDocument({
        id,
        basePath,
        filename,
        type: upload.mimeType,
        ownerId: upload.ownerId,
      });

      const tags = upload.tags;
      const plugin = getFileTypePluginByType(upload.mimeType);
      if (plugin) {
        const initialTags = await plugin.initialTags(upload.file);
        tags.push(...initialTags);
      }

      await Promise.all(
        tags.map((tag) =>
          this.tagService.addTagToDocument(id, tagToString(tag)),
        ),
      );

      await this.notifyUploadSuccess({
        file: upload.name,
        id,
        basePath,
        filename,
        mimeType: upload.mimeType,
        webSocketClientId: upload.webSocketClientId,
      });
    } catch (error) {
      let message = "Unknown error";
      if (error instanceof ApiError) {
        message = error.message;
      }
      console.error("Error occurred while processing upload message:", error);
      await this.notifyUploadFailed({
        file: upload.name,
        webSocketClientId: upload.webSocketClientId,
        reason: message,
      });
    }
  }

  private async notifyUploadSuccess(
    message: UploadFinishedMessage,
  ): Promise<void> {
    await this.webSocketServer.send(
      JSON.stringify({
        type: "upload-finished",
        file: message.file,
      }),
      message.webSocketClientId,
    );
  }

  private async notifyUploadFailed(
    message: UploadFailedMessage,
  ): Promise<void> {
    await this.webSocketServer.send(
      JSON.stringify({
        type: "upload-failed",
        file: message.file,
        reason: message.reason,
      }),
      message.webSocketClientId,
    );
  }
}
