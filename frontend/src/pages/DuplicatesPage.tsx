import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineDocumentDuplicate } from "react-icons/hi2";
import { BiLoader } from "react-icons/bi";
import type { ApiTag, DuplicateGroup } from "../app/api";
import { enhancedApi } from "../app/enhancedApi";
import { Button } from "../components/Button";
import { Pagination } from "../components/Pagination";
import { usePermission } from "../hooks/usePermission";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { DuplicateGroupCard } from "../sections/DuplicateGroupCard";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";

type ResolveRequest = {
  keepId: string;
  mergeIds: string[];
  tagsToAdd: ApiTag[];
  tagsToRemove: ApiTag[];
};

/** Picks the copy to keep when resolving a whole page at once. */
const oldestOf = (group: DuplicateGroup) =>
  [...group.documents].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )[0];

const newestOf = (group: DuplicateGroup) =>
  [...group.documents].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

export const DuplicatesPage = () => {
  const { t } = useTranslation();
  const { limit, offset, page, setPage } = usePageOffsetAndLimitParams(20);
  const canIndex = usePermission("admin:state");
  const [bulkRunning, setBulkRunning] = useState(false);

  const { data, isLoading } = enhancedApi.useListDuplicatesQuery({
    limit,
    offset,
  });
  // While a backfill runs, keep the pending counter moving without the user
  // having to reload the page.
  const { data: indexing } = enhancedApi.useGetDuplicateIndexingStatusQuery(
    undefined,
    { pollingInterval: 5000 },
  );
  const [startIndexing] = enhancedApi.useStartDuplicateIndexingMutation();
  const [resolveGroup] = enhancedApi.useResolveDuplicateGroupMutation();

  const groups = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const reclaimableOnPage = useMemo(
    () => groups.reduce((sum, group) => sum + group.reclaimableBytes, 0),
    [groups],
  );

  const onResolve = useCallback(
    async (contentHash: string, request: ResolveRequest) => {
      await resolveGroup({ contentHash, ...request }).unwrap();
    },
    [resolveGroup],
  );

  /**
   * Resolves every group on the current page, keeping one copy per group.
   * Sequential rather than parallel: each merge deletes rows the next query
   * depends on, and a partial failure should stop rather than cascade.
   */
  const resolveAll = useCallback(
    async (pick: (group: DuplicateGroup) => { id: string } | undefined) => {
      setBulkRunning(true);
      try {
        for (const group of groups) {
          const keeper = pick(group);
          if (!keeper) continue;
          await resolveGroup({
            contentHash: group.contentHash,
            keepId: keeper.id,
            mergeIds: group.documents
              .map((document) => document.id)
              .filter((id) => id !== keeper.id),
            tagsToAdd: [],
            tagsToRemove: [],
          }).unwrap();
        }
      } finally {
        setBulkRunning(false);
      }
    },
    [groups, resolveGroup],
  );

  const pendingIndexing = indexing?.pending ?? 0;

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <HiOutlineDocumentDuplicate className="text-text-muted" />
          {t("duplicates.title")}
        </h1>
        {groups.length > 0 && (
          <div className="flex flex-row gap-2">
            <Button
              variant="secondary"
              disabled={bulkRunning}
              onClick={() => resolveAll(oldestOf)}
            >
              {t("duplicates.keepOldest")}
            </Button>
            <Button
              variant="secondary"
              disabled={bulkRunning}
              onClick={() => resolveAll(newestOf)}
            >
              {t("duplicates.keepNewest")}
            </Button>
          </div>
        )}
      </div>

      {pendingIndexing > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 rounded-lg border border-border bg-surface-1">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {indexing?.running && (
              <BiLoader className="animate-spin text-text-muted" />
            )}
            <span>
              {indexing?.running
                ? t("duplicates.indexingRunning", {
                    processed: indexing.processed,
                    pending: pendingIndexing,
                  })
                : t("duplicates.indexingPending", { count: pendingIndexing })}
            </span>
          </div>
          {canIndex && !indexing?.running && (
            <Button onClick={() => startIndexing()}>
              {t("duplicates.startIndexing")}
            </Button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-text-muted text-center py-12">
          {t("common.loading")}
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="text-text-muted text-center py-12">
          {t("duplicates.empty")}
        </div>
      )}

      {groups.length > 0 && (
        <p className="text-sm text-text-muted mb-4">
          {t("duplicates.summary", {
            count: total,
            reclaimable: bytesToHumanReadable(reclaimableOnPage),
          })}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <DuplicateGroupCard
            key={group.contentHash}
            group={group}
            onResolve={(request) => onResolve(group.contentHash, request)}
          />
        ))}
      </div>

      {total > limit && (
        <Pagination
          total={total}
          limit={limit}
          currentPage={page}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </div>
  );
};
