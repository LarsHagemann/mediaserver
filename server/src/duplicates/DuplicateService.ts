import path from "path";
import { ApiError } from "../common/ApiError.js";
import type { Identity } from "../auth/Identity.js";
import type { AccessScopeResolver } from "../auth/AccessScopeResolver.js";
import type { FileService } from "../files/FileService.js";
import type { LoggingService } from "../common/LoggingService.js";
import type { ApiTag } from "../tags/TagRepository.js";
import type { PaginatedResponse } from "../util/PaginatedResponse.js";
import type {
  DuplicateGroup,
  DuplicateRepository,
} from "./DuplicateRepository.js";

export type ListDuplicatesRequest = {
  limit: number;
  offset: number;
};

export type ResolveDuplicateGroupRequest = {
  contentHash: string;
  keepId: string;
  mergeIds: string[];
  tagsToAdd: ApiTag[];
  tagsToRemove: ApiTag[];
};

export type ResolveDuplicateGroupResult = {
  keptId: string;
  mergedCount: number;
  reclaimedBytes: number;
};

export type IndexingStatus = {
  running: boolean;
  /** Documents hashed so far in the current (or most recent) run. */
  processed: number;
  /** Documents that could not be hashed, e.g. because the file is missing. */
  failed: number;
  /** Documents still without a content hash. */
  pending: number;
};

/** Rows pulled per backfill batch; keeps the working set small on large stores. */
const BACKFILL_BATCH_SIZE = 25;

export class DuplicateService {
  private indexing = false;
  private processed = 0;
  private readonly failedIds = new Set<string>();

  constructor(
    private readonly duplicateRepository: DuplicateRepository,
    private readonly fileService: FileService,
    private readonly accessScopeResolver: AccessScopeResolver,
    private readonly logger: LoggingService,
  ) {}

  public async listDuplicates(
    identity: Identity,
    { limit, offset }: ListDuplicatesRequest,
  ): Promise<PaginatedResponse<DuplicateGroup>> {
    return this.duplicateRepository.listDuplicateGroups({
      limit,
      offset,
      scope: this.accessScopeResolver.ownedDocumentScope(identity),
    });
  }

  /**
   * Collapses one duplicate group down to a single document.
   *
   * Authorization comes from the scope rather than a permission check: the
   * owned-document scope only ever yields documents the caller owns, so every
   * member of the group is theirs to delete. Admins and the IDP-disabled system
   * identity resolve to the unrestricted scope and may resolve any group.
   */
  public async resolveDuplicateGroup(
    identity: Identity,
    request: ResolveDuplicateGroupRequest,
  ): Promise<ResolveDuplicateGroupResult> {
    const { contentHash, keepId, mergeIds, tagsToAdd, tagsToRemove } = request;

    if (mergeIds.length === 0) {
      throw new ApiError(
        "BadRequest",
        400,
        "No documents given to merge into the kept document",
      );
    }
    if (mergeIds.includes(keepId)) {
      throw new ApiError(
        "BadRequest",
        400,
        "The kept document cannot also be merged away",
      );
    }
    if (new Set(mergeIds).size !== mergeIds.length) {
      throw new ApiError("BadRequest", 400, "Duplicate ids in mergeIds");
    }

    const scope = this.accessScopeResolver.ownedDocumentScope(identity);
    const members =
      (
        await this.duplicateRepository.listGroupMembers([contentHash], scope)
      ).get(contentHash) ?? [];

    if (members.length < 2) {
      throw new ApiError(
        "NotFound",
        404,
        `No resolvable duplicate group found for ${contentHash}`,
      );
    }

    // Every id must belong to this group *and* be in scope. Rejecting outright
    // rather than skipping unknown ids keeps a destructive operation from
    // quietly doing something other than what the client asked for.
    const memberIds = new Set(members.map((member) => member.id));
    for (const id of [keepId, ...mergeIds]) {
      if (!memberIds.has(id)) {
        throw new ApiError(
          "NotFound",
          404,
          `Document ${id} is not part of duplicate group ${contentHash}`,
        );
      }
    }

    const locations = await this.duplicateRepository.getFileLocations(mergeIds);

    await this.duplicateRepository.mergeGroup(
      keepId,
      mergeIds,
      tagsToAdd,
      tagsToRemove,
    );

    // Only once the rows are gone: an orphaned blob is recoverable, a row
    // pointing at a deleted file is not.
    for (const location of locations) {
      try {
        await this.fileService.removeDocumentFiles(
          location.base_path,
          location.filename,
          location.id,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to remove files for merged document ${location.id}`,
          error,
        );
      }
    }

    const sizeBytes = members[0]?.sizeBytes ?? 0;
    return {
      keptId: keepId,
      mergedCount: mergeIds.length,
      reclaimedBytes: sizeBytes * mergeIds.length,
    };
  }

  public async getIndexingStatus(): Promise<IndexingStatus> {
    return {
      running: this.indexing,
      processed: this.processed,
      failed: this.failedIds.size,
      pending: await this.duplicateRepository.countUnhashedDocuments(),
    };
  }

  /**
   * Hashes documents uploaded before content hashing existed. Safe to call
   * repeatedly — a run in progress is reported rather than started twice, and
   * an interrupted run simply resumes from whatever is still unhashed.
   */
  public async startIndexing(): Promise<IndexingStatus> {
    if (this.indexing) {
      return this.getIndexingStatus();
    }

    this.indexing = true;
    this.processed = 0;
    this.failedIds.clear();

    void this.runIndexing().catch((error) => {
      this.logger.error("Content hash backfill failed", error);
      this.indexing = false;
    });

    return this.getIndexingStatus();
  }

  private async runIndexing(): Promise<void> {
    try {
      for (;;) {
        const batch = await this.duplicateRepository.listUnhashedDocuments(
          BACKFILL_BATCH_SIZE,
          [...this.failedIds],
        );
        if (batch.length === 0) break;

        for (const document of batch) {
          try {
            const { contentHash, sizeBytes } =
              await this.fileService.digestFile(
                path.join(document.base_path, "documents", document.filename),
              );
            await this.duplicateRepository.setContentHash(
              document.id,
              contentHash,
              sizeBytes,
            );
            this.processed++;
          } catch (error) {
            // A missing or unreadable file must not stall the whole run; it is
            // remembered so the next batch query skips past it.
            this.failedIds.add(document.id);
            this.logger.warn(
              `Could not hash document ${document.id} (${document.filename})`,
              error,
            );
          }
        }
      }
      this.logger.info(
        `Content hash backfill finished: ${this.processed} hashed, ${this.failedIds.size} failed`,
      );
    } finally {
      this.indexing = false;
    }
  }
}
