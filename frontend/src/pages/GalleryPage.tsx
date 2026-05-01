import { enhancedApi } from "../app/enhancedApi";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { Pagination } from "../components/Pagination";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PreviewContainer } from "../sections/PreviewContainer";
import { useEasySearchParams } from "../hooks/useEasySearchParams";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { TagInput } from "../sections/TagInput";
import { FiGrid, FiList } from "react-icons/fi";
import { MdBookmarkAdd } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { useIsMobileScreen } from "../hooks/useIsMobileScreen";
import { CollectionFormModal } from "../sections/CollectionFormModal";

const remToPixel = (rem: number) => {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
};

/*

x = container width
m = thumbnail margin
t = thumbnail width
n = number of thumbnails per row

x < n * t + (n + 1) * m
x - m < n * (t + m)
n > (x - m) / (t + m)
n = floor((x - m) / (t + m))

*/

export const GalleryPage = () => {
  const { t } = useTranslation();

  const [layoutType, setLayoutType] = useState<"grid" | "list">("grid");
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [createCollection] = enhancedApi.useCreateCollectionMutation();

  const { limit, offset, page, setPage, setLimit } =
    usePageOffsetAndLimitParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const [documentsPerRow, setDocumentsPerRow] = useState<number>(0);
  const [documentsPerColumn, setDocumentsPerColumn] = useState<number>(5);
  const [thumbnailContainerWidth, setThumbnailContainerWidth] =
    useState<number>(0);

  const isMobile = useIsMobileScreen();

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const containerEntry = entries[0];
      if (containerEntry.contentBoxSize) {
        const thumbnailMargin = remToPixel(0.5);
        const containerPadding = remToPixel(0.5 * 2);
        const containerWidth = containerEntry.contentBoxSize[0].inlineSize;
        const thumbnailsPerRow = Math.floor(
          (containerWidth - thumbnailMargin - containerPadding) /
            (120 + thumbnailMargin * 2),
        );
        setDocumentsPerRow(thumbnailsPerRow);

        const containerHeight =
          containerEntry.contentBoxSize[0].blockSize * (isMobile ? 3 : 1);
        const thumbnailsPerColumn = Math.floor(
          (containerHeight - 250) / (120 + thumbnailMargin * 2),
        );
        setDocumentsPerColumn(thumbnailsPerColumn);

        setThumbnailContainerWidth(
          thumbnailsPerRow * (120 + thumbnailMargin * 2) +
            thumbnailMargin +
            containerPadding,
        );
      }
    });
    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
    };
  }, [isMobile]);

  useEffect(() => {
    setLimit(documentsPerRow * documentsPerColumn - 1);
  }, [documentsPerRow, setLimit, documentsPerColumn]);

  const {
    params: { preview: previewDocumentSearchParam, q: query },
    addSearchParam,
    removeSearchParam,
  } = useEasySearchParams(["preview", "q"]);

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTagInput((prev) => query || prev);
  }, [query]);

  const { currentData: data } = enhancedApi.useListDocumentsQuery({
    limit: limit,
    offset: offset,
    query: query,
  });

  const idToDocument = useMemo(
    () => Object.fromEntries((data?.items ?? []).map((d) => [d.id, d])),
    [data],
  );

  const total = useMemo(() => data?.total || 0, [data?.total]);

  const previewDocument = useMemo(
    () =>
      previewDocumentSearchParam
        ? idToDocument[previewDocumentSearchParam]
        : undefined,
    [idToDocument, previewDocumentSearchParam],
  );

  const setPreviewDocument = useCallback(
    (previewDocumentId: string | undefined) => {
      if (previewDocumentId) {
        addSearchParam("preview", previewDocumentId);
      } else {
        removeSearchParam("preview");
      }
    },
    [addSearchParam, removeSearchParam],
  );

  const nextPreviewImage = useCallback(() => {
    if (previewDocument?.nextId) {
      setPreviewDocument(previewDocument.nextId);
    }
  }, [setPreviewDocument, previewDocument]);

  const prevPreviewImage = useCallback(() => {
    if (previewDocument?.previousId) {
      setPreviewDocument(previewDocument.previousId);
    }
  }, [setPreviewDocument, previewDocument]);

  return (
    <div
      ref={containerRef}
      className="relative h-full flex flex-col items-center overflow-hidden"
    >
      <TagInput
        value={tagInput}
        onChange={setTagInput}
        onValidChange={() => {}}
        onSubmit={(value) => addSearchParam("q", value)}
        className="mb-2 p-2 w-full"
        placeholder={t("pages.gallery.tagInputPlaceholder")}
        blurOnSubmit
      />
      <div className="relative w-full">
        <Pagination
          total={total}
          limit={limit}
          currentPage={page}
          onPageChange={setPage}
        />
        <div className="relative text-right mr-2 sm:absolute sm:right-8 sm:top-2">
          {query && (
            <MdBookmarkAdd
              className="inline text-xl mb-1 mr-2 cursor-pointer hover:text-blue-400"
              title={t("collections.saveAsCollection")}
              onClick={() => setCollectionModalOpen(true)}
            />
          )}
          <FiGrid
            className={twMerge(
              "inline text-xl mb-1 mr-1",
              layoutType === "grid" && "text-blue-400",
              layoutType === "list" && "cursor-pointer",
            )}
            onClick={() => {
              setLayoutType("grid");
            }}
          />
          <FiList
            className={twMerge(
              "inline text-xl mb-1",
              layoutType === "list" && "text-blue-400",
              layoutType === "grid" && "cursor-pointer",
            )}
            onClick={() => {
              setLayoutType("list");
            }}
          />
        </div>
      </div>
      <div
        className="p-2 max-w-full max-h-[calc(100%-210px)] flex-grow overflow-auto"
        style={{
          width:
            layoutType === "grid" && !isMobile
              ? `${thumbnailContainerWidth}px`
              : "auto",
        }}
      >
        <ThumbnailContainer
          alignment="start"
          thumbnails={data?.items || []}
          onClick={(id) => {
            setPreviewDocument(id);
          }}
          layout={layoutType}
          size="small"
        />
      </div>
      <span className="p-2 w-full text-left">
        {t("pagination.range", {
          start: offset + 1,
          end: Math.min(offset + limit, total),
          total: total,
        })}
      </span>
      <Pagination
        total={total}
        limit={limit}
        currentPage={page}
        onPageChange={setPage}
        className="mb-4"
      />
      <CollectionFormModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        onSave={async (data) => {
          await createCollection(data);
          setCollectionModalOpen(false);
        }}
        initialFilterExpression={query}
      />
      {previewDocument && (
        <PreviewContainer
          totalDocuments={total}
          previewImageId={previewDocument.id}
          onThumbnailClicked={(id) => {
            setPreviewDocument(id);
          }}
          nextPreviewImage={nextPreviewImage}
          previousPreviewImage={prevPreviewImage}
          previewImageIndex={previewDocument.queryIndex}
          queryParams={{ limit, offset, query }}
          onClose={() => setPreviewDocument(undefined)}
        />
      )}
    </div>
  );
};
