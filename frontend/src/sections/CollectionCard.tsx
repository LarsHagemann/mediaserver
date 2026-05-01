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
  onEdit: (collection: Collection) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (collection: Collection) => void;
};

export const CollectionCard = ({
  collection,
  onEdit,
  onDelete,
  onToggleFavorite,
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
        "bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-gray-500 transition-all flex flex-col gap-2",
        collection.isFavorite && "border-yellow-500/50",
      )}
      onClick={() =>
        navigate(
          `/gallery?q=${encodeURIComponent(collection.filterExpression)}`,
        )
      }
    >
      <div className="flex justify-between items-start">
        <h3 className="text-white font-semibold text-lg truncate flex-1 mr-2">
          {collection.name}
        </h3>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(collection);
          }}
          className="text-yellow-400 hover:text-yellow-300 flex-shrink-0"
        >
          {collection.isFavorite ? <FaStar /> : <FaRegStar />}
        </IconButton>
      </div>

      {collection.description && (
        <p className="text-gray-400 text-sm line-clamp-2">
          {collection.description}
        </p>
      )}

      <div className="bg-gray-700 rounded px-2 py-1 text-sm text-blue-300 font-mono truncate">
        {collection.filterExpression || t("collections.emptyFilter")}
      </div>

      <div className="flex justify-between items-center mt-1">
        <span className="text-gray-400 text-sm">
          {t("collections.docCount", { count: docCount })}
        </span>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <IconButton
            className="text-lg text-gray-400 hover:text-white"
            onClick={() => onEdit(collection)}
          >
            <MdEdit />
          </IconButton>
          <IconButton
            className="text-lg text-gray-400 hover:text-red-400"
            onClick={() => onDelete(collection.id)}
          >
            <MdDelete />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
