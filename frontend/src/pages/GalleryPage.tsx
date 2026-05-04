import { enhancedApi } from "../app/enhancedApi";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { Pagination } from "../components/Pagination";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PreviewContainer } from "../sections/PreviewContainer";
import { useEasySearchParams } from "../hooks/useEasySearchParams";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { TagInput } from "../sections/TagInput";
import { FiGrid, FiList, FiShuffle } from "react-icons/fi";
import { MdBookmarkAdd, MdEdit } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { useIsMobileScreen } from "../hooks/useIsMobileScreen";
import { CollectionFormModal } from "../sections/CollectionFormModal";
import { useGallerySeed } from "../hooks/useGallerySeed";
import { Button } from "../components/Button";
import { BulkEditDocumentsModal } from "../sections/BulkEditDocumentsModal";

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
  const [editMode, setEditMode] = useState(false);
  const [editDocuments, setEditDocuments] = useState<Set<string>>(new Set());
  const [editDocumentsModalOpen, setEditDocumentsModalOpen] = useState(false);

  const { limit, offset, page, setPage, setLimit } =
    usePageOffsetAndLimitParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const [documentsPerRow, setDocumentsPerRow] = useState<number>(0);
  const [documentsPerColumn, setDocumentsPerColumn] = useState<number>(5);
  const [thumbnailContainerWidth, setThumbnailContainerWidth] =
    useState<number>(0);

  const isMobile = useIsMobileScreen();

  useEffect(() => {
    setEditDocuments(new Set());
  }, [editMode]);

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

  const {
    params: { preview: previewDocumentSearchParam, q: query },
    setSearchParams,
    addSearchParam,
    removeSearchParam,
  } = useEasySearchParams(["preview", "q"]);

  const { seed, reseedGallery } = useGallerySeed();
  const hasRandomSort = (query ?? "").includes("sort:random");

  useEffect(() => {
    if (!previewDocumentSearchParam) {
      setLimit(documentsPerRow * documentsPerColumn - 1);
    }
  }, [
    documentsPerRow,
    setLimit,
    documentsPerColumn,
    previewDocumentSearchParam,
  ]);

  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTagInput((prev) => query || prev);
  }, [query]);

  const { currentData: data } = enhancedApi.useListDocumentsQuery({
    limit: limit,
    offset: offset,
    query: query,
    seed: hasRandomSort ? seed : undefined,
  });

  useEffect(() => {
    if (data && data.items.length === 0) {
      if (page > 0) {
        setPage(page - 1);
      }
    }
  }, [data, page, setPage]);

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

  const lastKnownPreviewIndexRef = useRef<number>(0);
  if (previewDocument) {
    lastKnownPreviewIndexRef.current = previewDocument.queryIndex;
  }

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
      const nextId = previewDocument.nextId;
      const indexOnPage = previewDocument.queryIndex % limit;
      if (indexOnPage === limit - 1) {
        const newPage = page + 1;
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("page", String(newPage + 1));
          newParams.set("preview", nextId);
          return newParams;
        });
      } else {
        setPreviewDocument(nextId);
      }
    }
  }, [setPreviewDocument, previewDocument, setSearchParams, page, limit]);

  const prevPreviewImage = useCallback(() => {
    if (previewDocument?.previousId) {
      const previousId = previewDocument.previousId;
      const indexOnPage = previewDocument.queryIndex % limit;
      if (indexOnPage === 0) {
        const newPage = Math.max(page - 1, 0);
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("page", String(newPage + 1));
          newParams.set("preview", previousId);
          return newParams;
        });
      } else {
        setPreviewDocument(previewDocument.previousId);
      }
    }
  }, [setPreviewDocument, previewDocument, setSearchParams, page, limit]);

  const onInputSubmit = useCallback(
    (value: string) => {
      setPage(0);
      addSearchParam("q", value);
    },
    [addSearchParam, setPage],
  );

  const entirePageSelected = useMemo(() => {
    if (!data) {
      return false;
    }
    return data.items.every((item) => editDocuments.has(item.id));
  }, [data, editDocuments]);

  return (
    <div
      ref={containerRef}
      className="h-full relative flex flex-col gap-1 overflow-hidden"
    >
      <div className="flex flex-row gap-2 items-center">
        <TagInput
          value={tagInput}
          onChange={setTagInput}
          onValidChange={() => {}}
          onSubmit={onInputSubmit}
          className="flex flex-row p-2 w-full"
          placeholder={t("pages.gallery.tagInputPlaceholder")}
          blurOnSubmit
        />
        <Button
          className="mr-2 flex flex-row gap-2 items-center"
          onClick={() => setEditMode((prev) => !prev)}
          variant={editMode ? "primary" : "outline"}
        >
          <MdEdit className="inline text-md" />
          {t("pages.gallery.bulkEdit")}
        </Button>
      </div>
      {editMode && (
        <div className="px-2 flex flex-col bg-surface-1 text-sm text-text-primary p-2 gap-2">
          <div className="flex flex-row gap-2 items-center justify-start flex-wrap">
            <div className="flex flex-row gap-2 items-center">
              <div className="w-3 h-3 rounded-full bg-accent-subtle  border-accent border-3" />
              <span>{t("pages.gallery.editMode")}</span>
            </div>
            <div className="flex flex-grow justify-end">
              <span
                className="underline text-accent-subtle cursor-pointer"
                onClick={() => setEditMode(false)}
              >
                {t("pages.gallery.cancelEdit")}
              </span>
            </div>
          </div>
          <hr className="border-accent-subtle" />
          <div className="flex flex-row gap-2 items-center justify-start flex-wrap">
            <div className="rounded-lg bg-accent-subtle px-2">
              {editDocuments.size} {t("pages.gallery.selected")}
            </div>
            <Button
              variant="outline"
              className="p-0.5 px-1"
              onClick={() =>
                setEditDocuments((old) => {
                  const newSet = new Set(old);
                  const newDocumentIds = data?.items.map((d) => d.id) ?? [];
                  if (entirePageSelected) {
                    newDocumentIds.forEach((id) => newSet.delete(id));
                  } else {
                    newDocumentIds.forEach((id) => newSet.add(id));
                  }
                  return newSet;
                })
              }
            >
              {entirePageSelected
                ? t("pages.gallery.deselectPage")
                : t("pages.gallery.selectPage")}
            </Button>
            <Button
              variant="outline"
              className="p-0.5 px-1"
              onClick={() => setEditDocuments(new Set())}
            >
              {t("pages.gallery.clearSelection")}
            </Button>
            <Button
              variant="primary"
              className="p-0.5 px-1"
              onClick={() => setEditDocumentsModalOpen(true)}
              disabled={editDocuments.size === 0}
            >
              {t("pages.gallery.bulkEdit")}
            </Button>
            <div className="flex flex-grow justify-end text-text-muted">
              {t("pages.gallery.editDescription")}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-row justify-end gap-2 pr-2">
        {hasRandomSort && (
          <FiShuffle
            className="inline text-xl cursor-pointer hover:text-accent-subtle"
            title={t("pages.gallery.reseed")}
            onClick={reseedGallery}
          />
        )}
        {query && (
          <MdBookmarkAdd
            className="inline text-xl cursor-pointer hover:text-accent-subtle"
            title={t("collections.saveAsCollection")}
            onClick={() => setCollectionModalOpen(true)}
          />
        )}
        <FiGrid
          className={twMerge(
            "inline text-xl",
            layoutType === "grid" && "text-accent-subtle",
            layoutType === "list" && "cursor-pointer",
          )}
          onClick={() => {
            setLayoutType("grid");
          }}
        />
        <FiList
          className={twMerge(
            "inline text-xl",
            layoutType === "list" && "text-accent-subtle",
            layoutType === "grid" && "cursor-pointer",
          )}
          onClick={() => {
            setLayoutType("list");
          }}
        />
      </div>
      <div className="flex flex-row justify-center">
        <Pagination
          total={total}
          limit={limit}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
      <div
        className="p-2 max-w-full max-h-[calc(100%-210px)] mt-8 flex-grow overflow-auto"
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
            if (!editMode) {
              setPreviewDocument(id);
            } else {
              setEditDocuments((documents) => {
                const newSet = new Set(documents);
                if (newSet.has(id)) {
                  newSet.delete(id);
                } else {
                  newSet.add(id);
                }
                return newSet;
              });
            }
          }}
          layout={layoutType}
          size="small"
          onSelect={
            editMode
              ? (id, selected) => {
                  if (selected) {
                    setEditDocuments((documents) => {
                      documents.add(id);
                      return new Set(documents);
                    });
                  } else {
                    setEditDocuments((documents) => {
                      documents.delete(id);
                      return new Set(documents);
                    });
                  }
                }
              : undefined
          }
          selectedDocuments={editDocuments}
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
          await createCollection({ ...data, type: "dynamic" });
          setCollectionModalOpen(false);
        }}
        initialFilterExpression={query}
      />
      <BulkEditDocumentsModal
        documentIds={Array.from(editDocuments)}
        isOpen={editDocumentsModalOpen}
        onAbort={() => setEditDocumentsModalOpen(false)}
        onConfirm={() => {
          setEditDocumentsModalOpen(false);
          setEditDocuments(new Set());
          setEditMode(false);
        }}
      />
      {previewDocumentSearchParam && (
        <PreviewContainer
          totalDocuments={total}
          previewImageId={previewDocumentSearchParam}
          onThumbnailClicked={(id) => {
            setPreviewDocument(id);
          }}
          nextPreviewImage={nextPreviewImage}
          previousPreviewImage={prevPreviewImage}
          previewImageIndex={
            previewDocument?.queryIndex ?? lastKnownPreviewIndexRef.current
          }
          queryParams={{
            limit,
            offset,
            query,
            seed: hasRandomSort ? seed : undefined,
          }}
          onClose={() => setPreviewDocument(undefined)}
        />
      )}
    </div>
  );
};
