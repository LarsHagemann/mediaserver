import { useTranslation } from "react-i18next";
import { type Document } from "../app/api";
import { Pagination } from "../components/Pagination";
import { ThumbnailContainer } from "../components/ThumbnailContainer";

type Props = {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  onPageChange: (page: number) => void;
  layoutType: "grid" | "list";
  selectedDocuments?: Set<string>;
  onThumbnailClick: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
};

export const PaginatedThumbnailContainer = ({
  items,
  total,
  limit,
  offset,
  page,
  onPageChange,
  layoutType,
  selectedDocuments,
  onThumbnailClick,
  onSelect,
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-row justify-center">
        <Pagination
          total={total}
          limit={limit}
          currentPage={page}
          onPageChange={onPageChange}
        />
      </div>
      <div className="p-2 max-w-full max-h-[calc(100%-210px)] mt-8 flex-grow overflow-auto">
        <ThumbnailContainer
          alignment="start"
          thumbnails={items}
          onClick={onThumbnailClick}
          layout={layoutType}
          size="small"
          onSelect={onSelect}
          selectedDocuments={selectedDocuments}
        />
      </div>
      <span className="p-2 w-full text-left">
        {t("pagination.range", {
          start: offset + 1,
          end: Math.min(offset + limit, total),
          total,
        })}
      </span>
      <Pagination
        total={total}
        limit={limit}
        currentPage={page}
        onPageChange={onPageChange}
        className="mb-4"
      />
    </>
  );
};
