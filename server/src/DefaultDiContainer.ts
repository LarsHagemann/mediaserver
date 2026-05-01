import { Reference, type ContainerBuilder } from "node-dependency-injection";
import { EnvironmentService } from "./common/EnvironmentService.js";
import { DbService } from "./sql/DbService.js";
import { MigrationService } from "./sql/MigrationService.js";
import { LoggingService } from "./common/LoggingService.js";
import { DocumentRepository } from "./documents/DocumentRepository.js";
import { DocumentService } from "./documents/DocumentService.js";
import { FileService } from "./files/FileService.js";
import { WebSocketService } from "./websocket/WebSocketService.js";
import { TagRepository } from "./tags/TagRepository.js";
import { TagService } from "./tags/TagService.js";
import { TagCache } from "./tags/TagCache.js";
import { RedisClient } from "./redis/RedisClient.js";
import { BackendStateService } from "./state/BackendStateService.js";
import { BackendStateRepository } from "./state/BackendStateRepository.js";
import { UploadService } from "./files/UploadService.js";
import { CollectionRepository } from "./collections/CollectionRepository.js";
import { CollectionService } from "./collections/CollectionService.js";

export const services = {
  environment: "service.environment",
  db: "service.db",
  migration: "service.migration",
  logger: "service.logger",
  document: "service.document",
  file: "service.file",
  websocket: "service.websocket",
  tag: "service.tag",
  redis: "service.redis",
  backendState: "service.backendState",
  upload: "service.upload",
  collection: "service.collection",
};

export const repositories = {
  document: "repository.document",
  tag: "repository.tag",
  tagCache: "repository.tagCache",
  backendState: "repository.backendState",
  collection: "repository.collection",
};

export const defaultDiContainer = (diContainer: ContainerBuilder) => {
  diContainer.register(services.environment, EnvironmentService);

  diContainer
    .register(services.logger, LoggingService)
    .addArgument(new Reference(services.environment));

  diContainer
    .register(services.db, DbService)
    .addArgument(new Reference(services.environment))
    .addArgument(new Reference(services.logger));

  diContainer
    .register(services.migration, MigrationService)
    .addArgument(new Reference(services.environment))
    .addArgument(new Reference(services.db))
    .addArgument(new Reference(services.logger));

  diContainer
    .register(services.document, DocumentService)
    .addArgument(new Reference(repositories.document))
    .addArgument(new Reference(services.tag));

  diContainer
    .register(services.file, FileService)
    .addArgument(new Reference(services.logger));

  diContainer
    .register(services.websocket, WebSocketService)
    .addArgument(new Reference(services.environment))
    .addArgument(new Reference(services.logger));

  diContainer
    .register(services.tag, TagService)
    .addArgument(new Reference(repositories.tag))
    .addArgument(new Reference(repositories.tagCache));

  diContainer
    .register(services.redis, RedisClient)
    .addArgument(new Reference(services.environment));

  diContainer
    .register(services.backendState, BackendStateService)
    .addArgument(new Reference(repositories.backendState));

  diContainer
    .register(repositories.document, DocumentRepository)
    .addArgument(new Reference(services.db));

  diContainer
    .register(repositories.tagCache, TagCache)
    .addArgument(new Reference(services.redis));

  diContainer
    .register(repositories.tag, TagRepository)
    .addArgument(new Reference(services.db))
    .addArgument(new Reference(repositories.tagCache));

  diContainer
    .register(repositories.backendState, BackendStateRepository)
    .addArgument(new Reference(services.db))
    .addArgument(new Reference(services.file));

  diContainer.register(services.upload, UploadService)
    .addArgument(new Reference(services.file))
    .addArgument(new Reference(services.document))
    .addArgument(new Reference(services.tag))
    .addArgument(new Reference(services.websocket));

  diContainer
    .register(repositories.collection, CollectionRepository)
    .addArgument(new Reference(services.db));

  diContainer
    .register(services.collection, CollectionService)
    .addArgument(new Reference(repositories.collection));

  return diContainer;
};
