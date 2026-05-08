import { enhancedApi } from "../app/enhancedApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PreviewContainer } from "../sections/PreviewContainer";
import { useEasySearchParams } from "../hooks/useEasySearchParams";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { CollectionFormModal } from "../sections/CollectionFormModal";
import { useGallerySeed } from "../hooks/useGallerySeed";
import { BulkEditDocumentsModal } from "../sections/BulkEditDocumentsModal";
import { skipToken } from "@reduxjs/toolkit/query";
import { CollectionBadge } from "../components/CollectionBadge";
import { useFinalGalleryQuery } from "../hooks/useFinalGalleryQuery";
import { usePreviewNavigation } from "../hooks/usePreviewNavigation";
import { EditModePanel } from "../sections/EditModePanel";
import { GallerySearchBar } from "../sections/GallerySearchBar";
import { GalleryControls } from "../sections/GalleryControls";
import { PaginatedThumbnailContainer } from "../sections/PaginatedThumbnailContainer";

export const GalleryPage = () => {
  const [layoutType, setLayoutType] = useState<"grid" | "list">("grid");
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [createCollection] = enhancedApi.useCreateCollectionMutation();
  const [editMode, setEditMode] = useState(false);
  const [editDocuments, setEditDocuments] = useState<Set<string>>(new Set());
  const [editDocumentsModalOpen, setEditDocumentsModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { limit, offset, page, setPage } = usePageOffsetAndLimitParams();

  const {
    params: {
      preview: previewDocumentSearchParam,
      q: query,
      collection: collectionSearchParam,
    },
    setSearchParams,
    addSearchParam,
    removeSearchParam,
  } = useEasySearchParams(["preview", "q", "collection"]);

  const { data: collection } = enhancedApi.useGetCollectionByIdQuery(
    collectionSearchParam ?? skipToken,
  );

  const { seed, reseedGallery } = useGallerySeed();

  const { finalQuery, hasRandomSort } = useFinalGalleryQuery(
    query,
    collectionSearchParam,
    collection,
  );

  const { currentData: data } = enhancedApi.useListDocumentsQuery({
    limit,
    offset,
    query: finalQuery,
    seed: hasRandomSort ? seed : undefined,
  });

  useEffect(() => {
    if (data && data.items.length === 0 && page > 0) {
      setPage(page - 1);
    }
  }, [data, page, setPage]);

  useEffect(() => {
    setEditDocuments(new Set());
  }, [editMode]);

  useEffect(() => {
    setTagInput((prev) => query || prev);
  }, [query]);

  const idToDocument = useMemo(
    () => Object.fromEntries((data?.items ?? []).map((d) => [d.id, d])),
    [data],
  );

  const total = data?.total ?? 0;

  const {
    previewDocument,
    setPreviewDocument,
    nextPreviewImage,
    prevPreviewImage,
    lastKnownPreviewIndexRef,
  } = usePreviewNavigation({
    previewDocumentSearchParam,
    idToDocument,
    limit,
    page,
    addSearchParam,
    removeSearchParam,
    setSearchParams,
  });

  const onInputSubmit = useCallback(
    (value: string) => {
      setPage(0);
      addSearchParam("q", value);
    },
    [addSearchParam, setPage],
  );

  const entirePageSelected = useMemo(
    () => !!data && data.items.every((item) => editDocuments.has(item.id)),
    [data, editDocuments],
  );

  const onTogglePage = useCallback(() => {
    setEditDocuments((old) => {
      const newSet = new Set(old);
      const ids = data?.items.map((d) => d.id) ?? [];
      if (entirePageSelected) {
        ids.forEach((id) => newSet.delete(id));
      } else {
        ids.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  }, [data, entirePageSelected]);

  const onThumbnailClick = useCallback(
    (id: string) => {
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
    },
    [editMode, setPreviewDocument],
  );

  const onSelectDocument = useCallback((id: string, selected: boolean) => {
    setEditDocuments((documents) => {
      const newSet = new Set(documents);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="h-full relative flex flex-col gap-1 overflow-hidden">
      <GallerySearchBar
        value={tagInput}
        onChange={setTagInput}
        onSubmit={onInputSubmit}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
      />
      {collectionSearchParam && collection && (
        <div className="flex flex-row gap-2 px-2">
          <CollectionBadge
            collection={collection}
            onDelete={() => removeSearchParam("collection")}
          />
        </div>
      )}
      {editMode && (
        <EditModePanel
          editDocuments={editDocuments}
          entirePageSelected={entirePageSelected}
          onTogglePage={onTogglePage}
          onClearSelection={() => setEditDocuments(new Set())}
          onOpenBulkEdit={() => setEditDocumentsModalOpen(true)}
          onCancel={() => setEditMode(false)}
        />
      )}
      <GalleryControls
        hasRandomSort={hasRandomSort}
        onReseed={reseedGallery}
        hasQuery={!!query}
        onSaveCollection={() => setCollectionModalOpen(true)}
        layoutType={layoutType}
        onSetLayoutType={setLayoutType}
      />
      <PaginatedThumbnailContainer
        items={data?.items ?? []}
        total={total}
        limit={limit}
        offset={offset}
        page={page}
        onPageChange={setPage}
        layoutType={layoutType}
        selectedDocuments={editDocuments}
        onThumbnailClick={onThumbnailClick}
        onSelect={editMode ? onSelectDocument : undefined}
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
          onThumbnailClicked={(id) => setPreviewDocument(id)}
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
