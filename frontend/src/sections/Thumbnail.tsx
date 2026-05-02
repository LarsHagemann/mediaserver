import { twMerge } from "tailwind-merge";
import { useThumbnail } from "../hooks/useThumbnail";
import type { Document } from "../app/api";
import { Icon } from "../components/Icon";
import { fileIconFromMimeType } from "../util/fileIconFromFile";

const layouts = {
  grid: "w-[120px] h-[120px] m-2 transition-all duration-200 object-contain border-transparent border-1 hover:border-accent-muted",
  list: "flex flex-row gap-4 w-full p-2 border-b-border border-b-1 items-center cursor-pointer hover:bg-surface-3",
};

type Props = {
  document: Document;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
  layout?: keyof typeof layouts;
  size?: "normal" | "small";
};

export const Thumbnail = ({
  document,
  onClick,
  className,
  selected,
  layout = "grid",
  size = "normal",
}: Props) => {
  const { objectUrl, isLoading, error } = useThumbnail(document.id);

  if (isLoading || error) {
    return (
      <div className="w-[120px] h-[120px] bg-placeholder flex items-center justify-center" />
    );
  }

  return layout === "grid" ? (
    <img
      className={twMerge(
        layouts[layout],
        size === "small" && "w-[60px] h-[60px] sm:w-[120px] sm:h-[120px]",
        onClick && "cursor-pointer",
        className,
        selected && "border-accent-muted",
      )}
      src={objectUrl}
      alt="Document Thumbnail"
      onClick={onClick}
    />
  ) : (
    <div className={twMerge(layouts[layout], className)} onClick={onClick}>
      <Icon
        Icon={fileIconFromMimeType(document.mime)}
        size="medium"
        className="text-text-faint mr-4 basis-12"
      />
      <span className="flex-grow overflow-hidden text-nowrap text-ellipsis">
        {document.id}
      </span>
      <span className="basis-1/5">{document.mime} </span>
      <img src={objectUrl} className="w-12 h-12 object-contain" />
    </div>
  );
};
