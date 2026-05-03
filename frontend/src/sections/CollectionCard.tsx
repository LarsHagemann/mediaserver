import { useNavigate } from "react-router";
import { FaStar, FaRegStar, FaRegCheckCircle } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import { enhancedApi } from "../app/enhancedApi";
import type { Collection } from "../app/api";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { IconButton } from "../components/IconButton";
import { BiLoader } from "react-icons/bi";
import { FaRegCircle } from "react-icons/fa6";

type Props = {
  collection: Collection;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onToggleFavorite?: (collection: Collection) => void;
  onClick?: ((collection: Collection) => void) | 'navigate';
  isLoading?: boolean;
  isSelected?: boolean;
};

export const CollectionCard = ({
  collection,
  onEdit,
  onDelete,
  onToggleFavorite,
  onClick = 'navigate',
  isLoading,
  isSelected,
}: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data } = enhancedApi.useListDocumentsQuery({
    limit: 1,
    offset: 0,
    query: collection.filterExpression,
  });

  const docCount = data?.total ?? 0;

  return (
    <div
      className={twMerge(
        "bg-surface-1 rounded-lg p-4 border border-border cursor-pointer hover:border-border-strong transition-all flex flex-col flex-1 gap-2",
        collection.isFavorite && "border-yellow-500/50 hover:border-yellow-500",
      )}
      onClick={() => {
        if (onClick === 'navigate') {
          navigate(
            `/gallery?q=${encodeURIComponent(collection.filterExpression)}`,
          );
        } else if (onClick) {
          onClick(collection);
        }
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <h3 className="text-text-primary font-semibold text-lg truncate">
            {collection.name}
          </h3>
          <span
            className={twMerge(
              "flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium",
              collection.type === "static"
                ? "bg-badge-static text-badge-static-text"
                : "bg-accent-dim text-accent-muted",
            )}
          >
            {t(
              collection.type === "static"
                ? "collections.typeStatic"
                : "collections.typeDynamic",
            )}
          </span>
        </div>
        {onToggleFavorite && (<IconButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(collection);
          }}
          className="text-warning hover:text-warning flex-shrink-0"
        >
          {collection.isFavorite ? <FaStar /> : <FaRegStar />}
        </IconButton>
        )}
        {isLoading && <BiLoader className="animate-spin w-6 h-6" />}
        {!isLoading && onClick && isSelected !== undefined && (
          <IconButton
            className={twMerge(
              "text-lg text-text-muted hover:text-text-primary flex-shrink-0 w-6 h-6",
              isSelected && "text-green-500 hover:text-green-600",
            )}
          >
            {isSelected ? <FaRegCheckCircle className="w-6 h-6" /> : <FaRegCircle className="w-6 h-6" />}
          </IconButton>
        )}
      </div>

      {collection.description && (
        <p className="text-text-muted text-sm line-clamp-2">
          {collection.description}
        </p>
      )}

      {collection.type === "dynamic" && (
        <div className="bg-surface-2 rounded px-2 py-1 text-sm text-accent-muted font-mono truncate">
          {collection.filterExpression || t("collections.emptyFilter")}
        </div>
      )}

      <div className="flex justify-between items-center mt-1">
        <span className="text-text-muted text-sm">
          {t("collections.docCount", { count: docCount })}
        </span>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <IconButton
              className="text-lg text-text-muted hover:text-text-primary"
              onClick={() => onEdit(collection)}
            >
              <MdEdit />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              className="text-lg text-text-muted hover:text-danger-subtle"
              onClick={() => onDelete(collection)}
            >
              <MdDelete />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
};
