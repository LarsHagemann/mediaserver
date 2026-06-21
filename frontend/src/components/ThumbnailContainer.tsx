import { Thumbnail } from "../sections/Thumbnail";
import { DocumentCard } from "../sections/DocumentCard";
import { type Document, type ApiTag } from "../app/api";
import { twMerge } from "tailwind-merge";

const alignments = {
  center: "justify-center",
  start: "justify-start",
};

const directions = {
  row: "flex-row",
  column: "flex-col",
};

const flexWrap = {
  wrap: "flex-wrap",
  nowrap: "flex-nowrap",
};

type Props = {
  thumbnails: Document[];
  onClick?: (id: string) => void;
  alignment?: keyof typeof alignments;
  direction?: keyof typeof directions;
  wrap?: keyof typeof flexWrap;
  layout?: React.ComponentProps<typeof Thumbnail>["layout"];
  highlighted?: Set<string>;
  selectedDocuments?: Set<string>;
  className?: string;
  variant?: "card" | "thumbnail";
  onSelect?: (id: string, selected: boolean) => void;
  tagsMap?: Record<string, ApiTag[]>;
  popularTagKeys?: Set<string>;
};

export const ThumbnailContainer = ({
  thumbnails,
  onClick,
  alignment = "start",
  direction = "row",
  wrap = "wrap",
  layout = "grid",
  variant = "card",
  highlighted,
  selectedDocuments,
  className,
  onSelect,
  tagsMap,
  popularTagKeys,
}: Props) => {
  if (layout === "grid" && variant === "card") {
    return (
      <div
        className={twMerge(
          "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
          className,
        )}
      >
        {thumbnails.map((thumbnail) => (
          <DocumentCard
            key={thumbnail.id}
            document={thumbnail}
            tags={tagsMap?.[thumbnail.id]}
            popularTagKeys={popularTagKeys}
            onClick={() => onClick?.(thumbnail.id)}
            selected={selectedDocuments?.has(thumbnail.id)}
            onSelect={
              onSelect
                ? (selected) => onSelect(thumbnail.id, selected)
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        `flex ${directions[direction]} ${flexWrap[wrap]} ${alignments[alignment]} gap-4`,
        className,
      )}
    >
      {thumbnails.map((thumbnail, idx) => (
        <Thumbnail
          key={idx}
          document={thumbnail}
          onClick={() => onClick?.(thumbnail.id)}
          highlighted={highlighted?.has(thumbnail.id)}
          selected={selectedDocuments?.has(thumbnail.id)}
          layout={layout}
          onSelect={
            onSelect
              ? (selected) => onSelect(thumbnail.id, selected)
              : undefined
          }
        />
      ))}
    </div>
  );
};
