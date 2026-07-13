import { twMerge } from "tailwind-merge";
import { useThumbnail } from "../hooks/useThumbnail";
import { api, type Document, type ApiTag } from "../app/api";
import { fileIconFromMimeType } from "../util/fileIconFromFile";
import { SelectionIndicator } from "../components/SelectionIndicator";
import { MdLock, MdPublic } from "react-icons/md";
import { useMemo } from "react";

const mimeToExtLabel = (mime: string): string => {
  const parts = mime.split("/");
  if (parts.length === 2) {
    const sub = parts[1]!.toUpperCase();
    if (sub === "JPEG") return "JPG";
    if (sub === "QUICKTIME") return "MOV";
    if (sub === "X-MSVIDEO") return "AVI";
    return sub.slice(0, 4);
  }
  return mime.toUpperCase().slice(0, 4);
};

const parseDateFromTags = (tags: ApiTag[]): string | undefined => {
  const uploadedTag = tags.find((t) => t.key === "uploaded" && t.value);
  if (!uploadedTag?.value) return undefined;
  // value is "DD.MM.YYYY" (German locale from DocumentService)
  const [day, month, year] = uploadedTag.value.split(".");
  if (!day || !month || !year) return undefined;
  try {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  } catch {
    return undefined;
  }
};

type Props = {
  document: Document;
  tags?: ApiTag[];
  popularTagKeys?: Set<string>;
  onClick?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
};

export const DocumentCard = ({
  document,
  tags,
  popularTagKeys,
  onClick,
  selected,
  onSelect,
}: Props) => {
  const { objectUrl, isLoading, error } = useThumbnail(document.id);
  const { data: config } = api.useGetAppConfigQuery();
  const ext = mimeToExtLabel(document.mime);
  const Icon = fileIconFromMimeType(document.mime);

  const displayTags = useMemo(() => {
    if (!tags) return [];
    const nonMeta = tags.filter(
      (t) => t.type !== "meta" && t.type !== "collection",
    );
    if (popularTagKeys && popularTagKeys.size > 0) {
      const popular = nonMeta.filter((t) => {
        const key = t.value ? `${t.key}:${t.value}` : t.key;
        return popularTagKeys.has(key);
      });
      if (popular.length > 0) return popular.slice(0, 3);
    }
    return nonMeta.slice(0, 2);
  }, [tags, popularTagKeys]);

  const date = useMemo(
    () => (tags ? parseDateFromTags(tags) : undefined),
    [tags],
  );

  return (
    <div
      className={twMerge(
        "relative rounded-xl overflow-hidden bg-surface-1 border border-border cursor-pointer transition-colors hover:border-border-strong flex flex-col",
        selected && "ring-2 ring-accent",
      )}
      onClick={onClick}
    >
      {/* Thumbnail area */}
      <div className="relative w-full aspect-[4/3] bg-surface-2 overflow-hidden flex items-center justify-center">
        {!isLoading && !error && objectUrl ? (
          <img
            src={objectUrl}
            alt={document.friendlyName || document.id}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-10 h-10 text-text-faint" />
        )}

        {/* File type badge – top-left */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded backdrop-blur-sm leading-tight">
          {ext}
        </span>

        {/* Visibility icon – top-right (hidden when IDP disabled) */}
        {config?.idpEnabled && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
            {document.isPublic ? (
              <MdPublic className="w-3.5 h-3.5 text-amber-400" title="Public" />
            ) : (
              <MdLock className="w-3.5 h-3.5 text-white/70" title="Private" />
            )}
          </div>
        )}

        {/* Selection checkbox in edit mode */}
        {onSelect && (
          <div
            className="absolute top-1.5 left-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <SelectionIndicator
              selected={selected}
              onSelect={onSelect}
              size="medium"
            />
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">
          {document.friendlyName || document.id}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="px-1 py-0.5 bg-surface-2 border border-border-subtle text-[10px] font-bold rounded text-text-muted leading-tight">
            {ext}
          </span>
          {date && (
            <>
              <span className="text-text-faint">·</span>
              <span>{date}</span>
            </>
          )}
        </div>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {displayTags.map((tag) => {
              const label = tag.value ? `${tag.key}:${tag.value}` : tag.key;
              return (
                <span
                  key={label}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-chip-bg text-chip-text text-[11px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-subtle shrink-0" />
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
