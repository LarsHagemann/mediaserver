import { useTranslation } from "react-i18next";
import { type Document, type ApiTag } from "../app/api";
import { Pagination } from "../components/Pagination";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { enhancedApi } from "../app/enhancedApi";
import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";

type Props = {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  onPageChange: (page: number) => void;
  layoutType: "grid" | "list";
  selectedDocuments?: Set<string>;
  onThumbnailClick: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  popularTags?: ApiTag[];
};

export const PaginatedThumbnailContainer = ({
  items,
  total,
  limit,
  offset,
  page,
  onPageChange,
  layoutType,
  selectedDocuments,
  onThumbnailClick,
  onSelect,
  popularTags,
}: Props) => {
  const { t } = useTranslation();

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const { data: itemsWithTags } = enhancedApi.useListDocumentsByIdsQuery(
    layoutType === "grid" && itemIds.length > 0 ? itemIds : skipToken,
  );

  const tagsMap = useMemo(() => {
    if (!itemsWithTags) return {};
    return Object.fromEntries(itemsWithTags.map((d) => [d.id, d.tags]));
  }, [itemsWithTags]);

  const popularTagKeys = useMemo(() => {
    if (!popularTags) return new Set<string>();
    return new Set(
      popularTags.map((t) => (t.value ? `${t.key}:${t.value}` : t.key)),
    );
  }, [popularTags]);

  return (
    <>
      <div className="p-2 max-w-full flex-grow overflow-auto">
        <ThumbnailContainer
          alignment="start"
          thumbnails={items}
          onClick={onThumbnailClick}
          layout={layoutType}
          onSelect={onSelect}
          selectedDocuments={selectedDocuments}
          tagsMap={tagsMap}
          popularTagKeys={popularTagKeys}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-sm text-text-muted">
          {t("pagination.range", {
            start: offset + 1,
            end: Math.min(offset + limit, total),
            total,
          })}
        </span>
        <Pagination
          total={total}
          limit={limit}
          currentPage={page}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};
