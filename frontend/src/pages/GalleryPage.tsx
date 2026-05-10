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
import { GalleryControls, type TypeFilter } from "../sections/GalleryControls";
import { PaginatedThumbnailContainer } from "../sections/PaginatedThumbnailContainer";
import { useNavigate } from "react-router";
import { usePermission } from "../hooks/usePermission";
import { AiOutlineUpload } from "react-icons/ai";
import { MdEdit } from "react-icons/md";
import { Button } from "../components/Button";

export const GalleryPage = () => {
  const navigate = useNavigate();
  const canUpload = usePermission("document:upload");
  const [layoutType, setLayoutType] = useState<"grid" | "list">("grid");
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [createCollection] = enhancedApi.useCreateCollectionMutation();
  const [editMode, setEditMode] = useState(false);
  const [editDocuments, setEditDocuments] = useState<Set<string>>(new Set());
  const [editDocumentsModalOpen, setEditDocumentsModalOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { limit, offset, page, setPage } = usePageOffsetAndLimitParams();

  const {
    params: {
      preview: previewDocumentSearchParam,
      q: query,
      collection: collectionSearchParam,
      sort: sortParam,
    },
    setSearchParams,
    addSearchParam,
    removeSearchParam,
  } = useEasySearchParams(["preview", "q", "collection", "sort"]);

  const sortMode: "newest" | "random" =
    sortParam === "random" ? "random" : "newest";

  const { data: collection } = enhancedApi.useGetCollectionByIdQuery(
    collectionSearchParam ?? skipToken,
  );

  const { seed, reseedGallery } = useGallerySeed();

  const { data: allTagsData } = enhancedApi.useListTagsQuery({
    limit: 20,
    offset: 0,
    query: "",
  });
  const popularTags = useMemo(() => {
    if (!allTagsData) return [];
    return allTagsData.items
      .filter((tag) => tag.type !== "meta" && tag.type !== "collection")
      .slice(0, 5);
  }, [allTagsData]);

  const effectiveQuery = useMemo(() => {
    const parts: string[] = [];
    if (typeFilter !== "all") parts.push(typeFilter);
    if (query?.trim()) parts.push(query.trim());

    const combined =
      parts.length > 1
        ? parts.map((p) => `(${p})`).join(" & ")
        : (parts[0] ?? "");

    if (sortMode === "random" && !combined.includes("sort:random")) {
      return combined ? `(sort:random) & (${combined})` : "(sort:random)";
    }
    return combined || undefined;
  }, [typeFilter, query, sortMode]);

  const { finalQuery, hasRandomSort } = useFinalGalleryQuery(
    effectiveQuery,
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

  const onTagClick = useCallback(
    (tag: string) => {
      const current = tagInput.trim();
      const newQuery = current ? `${current} & ${tag}` : tag;
      setTagInput(newQuery);
      onInputSubmit(newQuery);
    },
    [tagInput, onInputSubmit],
  );

  const onSetSortMode = useCallback(
    (mode: "newest" | "random") => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "random") {
          next.set("sort", "random");
        } else {
          next.delete("sort");
        }
        next.set("page", "1");
        return next;
      });
      if (mode === "random") {
        reseedGallery();
      }
    },
    [setSearchParams, reseedGallery],
  );

  const onSetTypeFilter = useCallback(
    (type: TypeFilter) => {
      setTypeFilter(type);
      setPage(0);
    },
    [setPage],
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
    <div className="h-full relative flex flex-col gap-2 overflow-hidden">
      {/* Page header */}
      <div className="flex flex-col p-2">
        <div className="flex flex-row items-start justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Gallery</h1>
          </div>
          <div className="flex flex-row gap-2 shrink-0 mt-1">
            {canUpload && (
              <Button
                variant="secondary"
                onClick={() => navigate("/upload")}
                className="flex flex-row gap-2 items-center"
              >
                <AiOutlineUpload className="text-lg" />
                Upload
              </Button>
            )}
            <Button
              variant={editMode ? "primary" : "secondary"}
              onClick={() => setEditMode((prev) => !prev)}
              className="flex flex-row gap-2 items-center"
            >
              <MdEdit className="text-lg" />
              Edit
            </Button>
          </div>
        </div>
        <div className="hidden sm:block">
          <p className="text-text-muted text-sm mt-1">
            Everything you&apos;ve uploaded — searchable by tag, browsable by
            type, organized into collections.
          </p>
        </div>
      </div>

      <GallerySearchBar
        value={tagInput}
        onChange={setTagInput}
        onSubmit={onInputSubmit}
        popularTags={popularTags}
        onTagClick={onTagClick}
      />

      {collectionSearchParam && collection && (
        <div className="flex flex-row gap-2 px-3 shrink-0">
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
        sortMode={sortMode}
        onSetSortMode={onSetSortMode}
        typeFilter={typeFilter}
        onSetTypeFilter={onSetTypeFilter}
        total={total}
        pageSize={data?.items.length ?? 0}
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
        popularTags={popularTags}
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
        <div className="fixed top-0 left-0 w-screen h-screen bg-black z-100">
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
              query: finalQuery,
              seed: hasRandomSort ? seed : undefined,
            }}
            onClose={() => setPreviewDocument(undefined)}
          />
        </div>
      )}
    </div>
  );
};
