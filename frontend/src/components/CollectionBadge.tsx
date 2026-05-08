import { twMerge } from "tailwind-merge";
import type { Collection } from "../app/api";
import { Badge } from "./Badge";

type Props = {
  collection: Collection;
  onClick?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
};

export const CollectionBadge: React.FC<Props> = ({
  collection,
  onClick,
  onDelete,
}) => {
  return (
    <Badge
      className={twMerge(
        collection.type === "static"
          ? "bg-badge-static text-badge-static-text"
          : "bg-accent-dim text-accent-muted",
        collection.isFavorite && "border-yellow-500",
      )}
      onClick={onClick ? () => onClick(collection) : undefined}
      onDelete={onDelete ? () => onDelete(collection) : undefined}
    >
      {collection.name}
    </Badge>
  );
};
