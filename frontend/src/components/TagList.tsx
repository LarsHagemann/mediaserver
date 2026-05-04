import { twMerge } from "tailwind-merge";
import type { ApiTag } from "../app/api";
import { groupBy } from "../util/groupBy";

type Props = {
  tags: (ApiTag & { usageCount?: number })[];
  className?: string;
  groupHeadingBackgroundColor?: string;
  onClick?: (tag: ApiTag) => void;
  onDelete?: (tag: ApiTag) => void;
};

export const TagList = ({
  tags,
  onClick,
  onDelete,
  className,
  groupHeadingBackgroundColor = "bg-surface-1",
}: Props) => {
  const groupedTags = groupBy(tags, "type");

  return (
    <>
      {Array.from(groupedTags.entries()).map(([type, tagsOfType]) => (
        <div key={type} className="mb-4">
          <div className="relative">
            <hr className="m-2 mb-6 mt-2" />
            <h3
              className={twMerge(
                "absolute -top-3.5 text-lg font-semibold mb-2 ml-4 px-2",
                groupHeadingBackgroundColor,
              )}
            >
              {type}
            </h3>
          </div>
          <div
            className={twMerge(
              "flex flex-row flex-wrap items-start gap-2",
              className,
            )}
          >
            {tagsOfType.map((tag) => (
              <div
                key={`${tag.key}:${tag.value}`}
                onClick={() => onClick?.(tag)}
                className={twMerge(
                  "px-2 py-1 bg-chip-bg rounded-full text-sm duration-200 h-8 basis-8 flex items-center z-90",
                  onClick
                    ? "cursor-pointer hover:bg-chip-hover"
                    : "cursor-default",
                )}
              >
                <span className="text-chip-text">
                  {tag.key}
                  {tag.value ? `:${tag.value}` : ""}
                </span>
                {typeof tag.usageCount === "number" && (
                  <span className="ml-1 text-gray-400">({tag.usageCount})</span>
                )}
                {onDelete && (
                  <span
                    className="ml-1 cursor-delete text-gray-400 hover:text-red-500 text-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(tag);
                    }}
                  >
                    &times;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
