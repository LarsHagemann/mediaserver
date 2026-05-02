import { useNavigate } from "react-router";
import { FaStar, FaRegStar } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import { enhancedApi } from "../app/enhancedApi";
import type { Collection } from "../app/api";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { IconButton } from "../components/IconButton";

type Props = {
  collection: Collection;
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onToggleFavorite?: (collection: Collection) => void;
  onClick?: ((collection: Collection) => void) | 'navigate';
};

export const CollectionCard = ({
  collection,
  onEdit,
  onDelete,
  onToggleFavorite,
  onClick = 'navigate',
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
        "bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-500 transition-all flex flex-col flex-1 gap-2",
        collection.isFavorite && "border-yellow-500/50",
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
          <h3 className="text-white font-semibold text-lg truncate">
            {collection.name}
          </h3>
          <span
            className={twMerge(
              "flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium",
              collection.type === "static"
                ? "bg-purple-900/60 text-purple-300"
                : "bg-blue-900/60 text-blue-300",
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
          className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
        >
          {collection.isFavorite ? <FaStar /> : <FaRegStar />}
        </IconButton>
        )}
      </div>

      {collection.description && (
        <p className="text-gray-400 text-sm line-clamp-2">
          {collection.description}
        </p>
      )}

      {collection.type === "dynamic" && (
        <div className="bg-gray-700 rounded px-2 py-1 text-sm text-blue-300 font-mono truncate">
          {collection.filterExpression || t("collections.emptyFilter")}
        </div>
      )}

      <div className="flex justify-between items-center mt-1">
        <span className="text-gray-400 text-sm">
          {t("collections.docCount", { count: docCount })}
        </span>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <IconButton
              className="text-lg text-gray-400 hover:text-white"
              onClick={() => onEdit(collection)}
            >
              <MdEdit />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              className="text-lg text-gray-400 hover:text-red-400"
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
