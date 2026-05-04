import { Thumbnail } from "../sections/Thumbnail";
import { type Document } from "../app/api";
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
  size?: "normal" | "small";
  onSelect?: (id: string, selected: boolean) => void;
};

export const ThumbnailContainer = ({
  thumbnails,
  onClick,
  alignment = "start",
  direction = "row",
  wrap = "wrap",
  layout = "grid",
  size = "normal",
  highlighted,
  selectedDocuments,
  className,
  onSelect,
}: Props) => {
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
          size={size}
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
