import { twMerge } from "tailwind-merge";
import type { ApiTag } from "../app/api";
import { groupBy } from "../util/groupBy";
import { TagBadge } from "./TagBadge";

type Props = {
  tags: (ApiTag & { usageCount?: number })[];
  className?: string;
  onClick?: (tag: ApiTag) => void;
  onDelete?: (tag: ApiTag) => void;
};

export const TagList = ({ tags, onClick, onDelete, className }: Props) => {
  const groupedTags = groupBy(tags, "type");

  return (
    <div className={twMerge("flex flex-col gap-6", className)}>
      {Array.from(groupedTags.entries()).map(([type, tagsOfType]) => (
        <div key={type}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            {type}
          </h3>
          <div className="flex flex-row flex-wrap gap-2">
            {tagsOfType.map((tag) => (
              <TagBadge
                key={`${tag.key}:${tag.value}`}
                tag={tag}
                onClick={onClick}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
