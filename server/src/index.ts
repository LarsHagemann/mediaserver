import * as express from "express";
import { EnvironmentService } from "./common/EnvironmentService.js";
import { services } from "./DefaultDiContainer.js";
import { DI_CONTAINER, setupDiContainer } from "./DiContainer.js";
import { MigrationService } from "./sql/MigrationService.js";
import { DbService } from "./sql/DbService.js";
import fileUpload from "express-fileupload";
import { documentRouter } from "./routers/DocumentRouter.js";
import * as cors from "cors";
import { apiHandler } from "./ApiHandler.js";
import { WebSocketService } from "./websocket/WebSocketService.js";
import { tagRouter } from "./routers/TagRouter.js";
import { TagService } from "./tags/TagService.js";
import { RedisClient } from "./redis/RedisClient.js";
import { stateRouter } from "./routers/StateRouter.js";
import { collectionRouter } from "./routers/CollectionRouter.js";
import type { LoggingService } from "./common/LoggingService.js";
import { loadPlugins } from "./plugins/pluginLoader.js";
import { addFileTypePlugin } from "./plugins/fileTypes.js";
import { standardPlugins } from "./plugins/standardPlugins.js";

async function run(envService: EnvironmentService) {
  const app = express.default();
  const port = envService.backendPort;

  app.use(express.json());
  app.use(cors.default());

  app.use(
    express.urlencoded({
      extended: true,
    }),
  );

  app.use(
    fileUpload({
      limits: { fileSize: envService.fileUploadSizeLimit },
      useTempFiles: true,
      tempFileDir: "/tmp/",
    }),
  );

  app.get(
    "/health",
    apiHandler(async () => {
      return {
        status: 200,
        body: {
          status: "healthy",
        },
      };
    }),
  );

  app.use("/documents", documentRouter);
  app.use("/tags", tagRouter);
  app.use("/state", stateRouter);
  app.use("/collections", collectionRouter);

  const logger = DI_CONTAINER.get<LoggingService>(services.logger);

  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

async function main() {
  const diContainer = await setupDiContainer();
  const dbService = diContainer.get<DbService>(services.db);
  const migrationService = diContainer.get<MigrationService>(
    services.migration,
  );

  Object.entries(standardPlugins).forEach(([name, plugin]) => {
    addFileTypePlugin(name, plugin);
  });

  await loadPlugins();

  await dbService.connect();
  await migrationService.migrate();

  const webSocketServer = diContainer.get<WebSocketService>(services.websocket);

  const envService = diContainer.get<EnvironmentService>(services.environment);
  const tagService = diContainer.get<TagService>(services.tag);
  const redisClient = diContainer.get<RedisClient>(services.redis);

  await webSocketServer.start();
  await redisClient.connect();
  await tagService.initIdCache();

  await run(envService);
}

void main().catch((err) => {
  console.error(err, new Error().stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason instanceof Error ? reason.stack : reason,
  );
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err, err.stack);
  process.exit(1);
});
