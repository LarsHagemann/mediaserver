import { ApiError } from "../common/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { createHash } from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { getFileTypePluginByType } from "../plugins/fileTypes.js";
import { EnvironmentService } from "../common/EnvironmentService.js";
import z from "zod";
import checkDiskSpace from "check-disk-space";

export type FileServiceConfig = {
  defaultThumbnailPath: string;
  documentStoreConfigPath: string;
};

type ThumbnailResult = {
  path: string;
  removeAfterCopy: boolean;
};

type MoveDocumentResult = {
  id: string;
  basePath: string;
  filename: string;
  contentHash: string;
  sizeBytes: number;
};

export type FileDigest = {
  contentHash: string;
  sizeBytes: number;
};

const documentStoreConfigSchema = z.object({
  stores: z.array(
    z.object({
      path: z.string().min(2).max(100),
    }),
  ),
});
type DocumentStoreConfig = z.infer<typeof documentStoreConfigSchema>;

// File extensions are concatenated directly into on-disk paths
// (`<uuid>.<extension>`), so they must be a strict alphanumeric token to
// prevent path traversal and other filesystem surprises.
const SAFE_EXTENSION = /^[a-zA-Z0-9]{1,12}$/;

export const isValidExtension = (extension: string): boolean =>
  SAFE_EXTENSION.test(extension);

export class FileService {
  private readonly config: FileServiceConfig;
  private storeConfig?: DocumentStoreConfig;

  constructor() {
    this.config = new EnvironmentService().fileServiceConfig;

    fs.readFile(this.config.documentStoreConfigPath, "utf-8").then((data) => {
      this.storeConfig = documentStoreConfigSchema.parse(JSON.parse(data));
    });
  }

  public getFileServiceConfig():
    | z.infer<typeof documentStoreConfigSchema>
    | undefined {
    return this.storeConfig;
  }

  private async findBasePathForDocument(
    source: string,
    size: number,
  ): Promise<string> {
    if (!this.storeConfig) {
      throw new ApiError("NotReady", 500, "DocumentStoreConfig not ready");
    }

    for (const store of this.storeConfig.stores) {
      // @ts-expect-error This is correct
      const result = await checkDiskSpace(store.path);
      if (result.free >= size) {
        await fs.mkdir(`${store.path}/documents`, { recursive: true });
        await fs.mkdir(`${store.path}/thumbnails`, { recursive: true });

        return store.path;
      }
    }

    throw new ApiError(
      "NoStoreSuitable",
      500,
      "No suitable document store found",
    );
  }

  private async createThumbnail(
    source: string,
    type: string,
  ): Promise<ThumbnailResult> {
    const plugin = getFileTypePluginByType(type);
    if (plugin) {
      const { path } = await plugin.thumbnailCreator({
        path: source,
        uuidv4,
      });
      return { path, removeAfterCopy: true };
    }

    return {
      path: this.config.defaultThumbnailPath,
      removeAfterCopy: false,
    };
  }

  /**
   * Copies `source` to `destination` while digesting the bytes as they stream
   * past. Duplicate detection needs a content hash for every document, and
   * folding it into the copy keeps that free: the file is read exactly once,
   * which matters for the multi-gigabyte videos this server accepts.
   */
  private async copyAndDigest(
    source: string,
    destination: string,
  ): Promise<FileDigest> {
    const hash = createHash("sha256");
    let sizeBytes = 0;

    const digest = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        hash.update(chunk);
        sizeBytes += chunk.length;
        callback(null, chunk);
      },
    });

    await pipeline(
      createReadStream(source),
      digest,
      createWriteStream(destination),
    );

    return { contentHash: hash.digest("hex"), sizeBytes };
  }

  /**
   * Digests a file already living in a document store, for backfilling rows
   * that predate content hashing.
   */
  public async digestFile(path: string): Promise<FileDigest> {
    const hash = createHash("sha256");
    let sizeBytes = 0;

    for await (const chunk of createReadStream(path)) {
      hash.update(chunk as Buffer);
      sizeBytes += (chunk as Buffer).length;
    }

    return { contentHash: hash.digest("hex"), sizeBytes };
  }

  public async moveDocument(
    source: string,
    type: string,
    extension: string,
    size: number,
  ): Promise<MoveDocumentResult> {
    if (!isValidExtension(extension)) {
      throw new ApiError("BadRequest", 400, "Invalid file extension");
    }

    const basePath = await this.findBasePathForDocument(source, size);
    const id = uuidv4();

    const { contentHash, sizeBytes } = await this.copyAndDigest(
      source,
      `${basePath}/documents/${id}.${extension}`,
    );
    const { path: thumbnailTmpPath, removeAfterCopy } =
      await this.createThumbnail(source, type);
    await fs.copyFile(thumbnailTmpPath, `${basePath}/thumbnails/${id}.jpg`);

    if (removeAfterCopy) {
      await fs.rm(thumbnailTmpPath);
    }
    await fs.rm(source);

    return {
      id,
      basePath,
      filename: `${id}.${extension}`,
      contentHash,
      sizeBytes,
    };
  }

  /**
   * Removes a document's stored blob and thumbnail. Missing files are ignored:
   * deletion must stay idempotent so a half-cleaned store cannot wedge the
   * database delete that follows it.
   */
  public async removeDocumentFiles(
    basePath: string,
    filename: string,
    id: string,
  ): Promise<void> {
    await fs.rm(`${basePath}/documents/${filename}`, { force: true });
    await fs.rm(`${basePath}/thumbnails/${id}.jpg`, { force: true });
  }
}
