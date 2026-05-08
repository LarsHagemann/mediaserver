import { useTranslation } from "react-i18next";
import { FiGrid, FiList, FiShuffle } from "react-icons/fi";
import { MdBookmarkAdd } from "react-icons/md";
import { twMerge } from "tailwind-merge";

type Props = {
  hasRandomSort: boolean;
  onReseed: () => void;
  hasQuery: boolean;
  onSaveCollection: () => void;
  layoutType: "grid" | "list";
  onSetLayoutType: (type: "grid" | "list") => void;
};

export const GalleryControls = ({
  hasRandomSort,
  onReseed,
  hasQuery,
  onSaveCollection,
  layoutType,
  onSetLayoutType,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row justify-end gap-2 pr-2">
      {hasRandomSort && (
        <FiShuffle
          className="inline text-xl cursor-pointer hover:text-accent-subtle"
          title={t("pages.gallery.reseed")}
          onClick={onReseed}
        />
      )}
      {hasQuery && (
        <MdBookmarkAdd
          className="inline text-xl cursor-pointer hover:text-accent-subtle"
          title={t("collections.saveAsCollection")}
          onClick={onSaveCollection}
        />
      )}
      <FiGrid
        className={twMerge(
          "inline text-xl",
          layoutType === "grid" && "text-accent-subtle",
          layoutType === "list" && "cursor-pointer",
        )}
        onClick={() => onSetLayoutType("grid")}
      />
      <FiList
        className={twMerge(
          "inline text-xl",
          layoutType === "list" && "text-accent-subtle",
          layoutType === "grid" && "cursor-pointer",
        )}
        onClick={() => onSetLayoutType("list")}
      />
    </div>
  );
};
