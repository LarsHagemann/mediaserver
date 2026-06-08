import { useTranslation } from "react-i18next";
import { TagInput } from "./TagInput";
import type { ApiTag } from "../app/api";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  popularTags: ApiTag[];
  onTagClick: (tag: string) => void;
};

export const GallerySearchBar = ({
  value,
  onChange,
  onSubmit,
  popularTags,
  onTagClick,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 px-2">
      <TagInput
        value={value}
        onChange={onChange}
        onValidChange={() => {}}
        onSubmit={onSubmit}
        className="w-full"
        placeholder={t("pages.gallery.tagInputPlaceholder")}
        showSearchIcon
        blurOnSubmit
      />
      {popularTags.length > 0 && (
        <div className="flex flex-row flex-wrap gap-1.5 px-1">
          {popularTags.map((tag) => {
            const label = tag.value ? `${tag.key}:${tag.value}` : tag.key;
            return (
              <button
                key={label}
                onClick={() => onTagClick(label)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-chip-bg text-chip-text text-xs hover:bg-chip-hover transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-subtle shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
