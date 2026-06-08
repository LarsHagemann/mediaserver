import { useTranslation } from "react-i18next";
import { FiGrid, FiList, FiShuffle } from "react-icons/fi";
import { MdBookmarkAdd } from "react-icons/md";
import { twMerge } from "tailwind-merge";

export type TypeFilter = "all" | "image" | "video" | "application" | "text";

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "application", label: "Documents" },
  { key: "text", label: "Data" },
];

type Props = {
  hasRandomSort: boolean;
  onReseed: () => void;
  hasQuery: boolean;
  onSaveCollection: () => void;
  layoutType: "grid" | "list";
  onSetLayoutType: (type: "grid" | "list") => void;
  sortMode: "newest" | "random";
  onSetSortMode: (mode: "newest" | "random") => void;
  typeFilter: TypeFilter;
  onSetTypeFilter: (type: TypeFilter) => void;
  total: number;
  pageSize: number;
};

export const GalleryControls = ({
  hasRandomSort,
  onReseed,
  hasQuery,
  onSaveCollection,
  layoutType,
  onSetLayoutType,
  sortMode,
  onSetSortMode,
  typeFilter,
  onSetTypeFilter,
  total,
  pageSize,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 px-3 py-1">
      {/* Type filter tabs — scrollable row on mobile */}
      <div className="flex flex-row items-center gap-0.5 overflow-x-auto scrollbar-hide">
        {TYPE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSetTypeFilter(key)}
            className={twMerge(
              "px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap",
              typeFilter === key
                ? "bg-surface-3 text-text-primary font-medium"
                : "text-text-muted hover:text-text-secondary hover:bg-surface-2",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex flex-row items-center gap-3 shrink-0">
        {hasQuery && (
          <MdBookmarkAdd
            className="text-xl cursor-pointer text-text-muted hover:text-accent-subtle transition-colors"
            title={t("collections.saveAsCollection")}
            onClick={onSaveCollection}
          />
        )}
        <span className="text-sm text-text-muted whitespace-nowrap">
          {pageSize} of {total}
        </span>
        <div className="flex items-center gap-1.5">
          <select
            value={sortMode}
            onChange={(e) =>
              onSetSortMode(e.target.value as "newest" | "random")
            }
            className="bg-surface-2 border border-border text-text-secondary text-sm rounded-md px-2 py-1 cursor-pointer appearance-none"
          >
            <option value="newest">Newest first</option>
            <option value="random">Random</option>
          </select>
          {hasRandomSort && (
            <FiShuffle
              className="text-lg cursor-pointer text-text-muted hover:text-accent-subtle transition-colors"
              title={t("pages.gallery.reseed")}
              onClick={onReseed}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <FiGrid
            className={twMerge(
              "text-xl transition-colors",
              layoutType === "grid"
                ? "text-accent-subtle"
                : "cursor-pointer text-text-muted hover:text-text-secondary",
            )}
            onClick={() => onSetLayoutType("grid")}
          />
          <FiList
            className={twMerge(
              "text-xl transition-colors",
              layoutType === "list"
                ? "text-accent-subtle"
                : "cursor-pointer text-text-muted hover:text-text-secondary",
            )}
            onClick={() => onSetLayoutType("list")}
          />
        </div>
      </div>
    </div>
  );
};
