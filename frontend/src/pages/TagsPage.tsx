import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineLocalOffer } from "react-icons/md";
import { useNavigate } from "react-router";
import { enhancedApi } from "../app/enhancedApi";
import { TagList } from "../components/TagList";
import { Pagination } from "../components/Pagination";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { useDebounce } from "../hooks/useDebounce";

export const TagsPage = () => {
  const { t } = useTranslation();
  const { limit, offset, page, setPage } = usePageOffsetAndLimitParams(50);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data } = enhancedApi.useListTagsQuery({
    limit,
    offset,
    query: debouncedSearch,
  });

  const total = useMemo(() => data?.total ?? 0, [data?.total]);
  const navigate = useNavigate();

  const tags = useMemo(
    () => data?.items.filter((tag) => tag.key !== "collection") ?? [],
    [data?.items],
  );

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <MdOutlineLocalOffer className="text-text-muted" />
          {t("pages.tags.title")}
        </h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("pages.tags.searchPlaceholder")}
          className="w-full sm:w-64 px-3 py-1.5 rounded-lg text-sm bg-surface-1 border border-border text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-strong"
        />
      </div>

      {tags.length === 0 && (
        <div className="text-text-muted text-center py-12">
          {t("pages.tags.empty")}
        </div>
      )}

      <TagList
        tags={tags}
        onClick={(tag) =>
          navigate(`../gallery?q=${tag.key}${tag.value ? `:${tag.value}` : ""}`)
        }
      />

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
