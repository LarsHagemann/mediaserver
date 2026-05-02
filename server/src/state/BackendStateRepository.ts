import z from "zod";
import type { FileService } from "../files/FileService.js";
import type { DbService } from "../sql/DbService.js";
import * as cds from "check-disk-space";
import { fileTypes } from "../plugins/fileTypes.js";
import { standardPlugins } from "../plugins/standardPlugins.js";

export interface StoreState {
  free: number;
  total: number;
  used: number;
  numberOfDocuments: number;
  basePath: string;
}

export interface PluginState {
  name: string;
  trusted: boolean;
  description: string;
}

export interface BackendState {
  stores: StoreState[];
  plugins: PluginState[];
  uptime: number;
  version: string;
  commit: string;
}

export class BackendStateRepository {
  constructor(
    private readonly dbService: DbService,
    private readonly fileService: FileService,
  ) {}

  private async getStoreState(): Promise<StoreState[]> {
    const config = this.fileService.getFileServiceConfig();
    if (!config) {
      throw new Error("FileService config not ready");
    }

    const states: StoreState[] = [];

    await Promise.all(
      config.stores.map(async (store) => {
        const result = await this.dbService.one(
          z.object({
            number_of_documents: z.number(),
          }),
          `
            SELECT COUNT(*)::INTEGER AS number_of_documents
            FROM documents
            WHERE base_path = $1
          `,
          [store.path],
        );

        // @ts-expect-error This is correct
        const diskSpace = await cds.default(store.path);

        states.push({
          basePath: store.path,
          free: diskSpace.free,
          total: diskSpace.size,
          used: diskSpace.size - diskSpace.free,
          numberOfDocuments: result.number_of_documents ?? 0,
        });
      }),
    );

    return states;
  }

  async getBackendState(): Promise<BackendState> {
    const stores = await this.getStoreState();
    return {
      stores,
      uptime: process.uptime(),
      plugins: Object.entries(fileTypes).map(([name, plugin]) => ({
        name,
        trusted: Object.values(standardPlugins).includes(plugin),
        description: plugin.description,
      })),
      version: process.env.APP_VERSION || "unknown",
      commit: process.env.COMMITHASH || "unknown",
    };
  }
}
