import { ApiError } from "../common/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs/promises";
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

    await fs.copyFile(source, `${basePath}/documents/${id}.${extension}`);
    const { path: thumbnailTmpPath, removeAfterCopy } =
      await this.createThumbnail(source, type);
    await fs.copyFile(thumbnailTmpPath, `${basePath}/thumbnails/${id}.jpg`);

    if (removeAfterCopy) {
      await fs.rm(thumbnailTmpPath);
    }
    await fs.rm(source);

    return { id, basePath, filename: `${id}.${extension}` };
  }
}
