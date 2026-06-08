import { FaTimes } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import type { ApiTag } from "../app/api";

type Props = {
  tag: ApiTag & { usageCount?: number };
  onClick?: (tag: ApiTag) => void;
  onDelete?: (tag: ApiTag) => void;
  className?: string;
};

export const TagBadge = ({ tag, onClick, onDelete, className }: Props) => {
  const label = tag.value ? `${tag.key}:${tag.value}` : tag.key;

  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={() => onClick?.(tag)}
      className={twMerge(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
        "bg-chip-bg text-chip-text",
        onClick && "cursor-pointer hover:bg-chip-hover",
        !onClick && "cursor-default",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent-subtle shrink-0" />
      <span>{label}</span>
      {typeof tag.usageCount === "number" && (
        <span className="text-text-faint ml-0.5">({tag.usageCount})</span>
      )}
      {onDelete && (
        <FaTimes
          className="w-2.5 h-2.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tag);
          }}
        />
      )}
    </div>
  );
};
