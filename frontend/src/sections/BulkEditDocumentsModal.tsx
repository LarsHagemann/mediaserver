import { useTranslation } from "react-i18next";
import { Modal } from "../components/Modal";
import { ButtonSelector } from "../components/ButtonSelector";
import { useCallback, useEffect, useMemo, useState } from "react";
import { enhancedApi } from "../app/enhancedApi";
import { TagList } from "../components/TagList";
import { TagInput } from "./TagInput";
import { skipToken } from "@reduxjs/toolkit/query";
import type { ApiTag } from "../app/api";
import { Button } from "../components/Button";
import { CollectionCard } from "./CollectionCard";
import { BiLoader } from "react-icons/bi";
import { tagToString, stringToTag } from "../util/tag";

type Props = {
  documentIds: string[];
  isOpen: boolean;
  onConfirm: () => void;
  onAbort: () => void;
};

export const BulkEditDocumentsModal = ({
  documentIds,
  isOpen,
  onConfirm,
  onAbort,
}: Props) => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<"collection" | "tag">(
    "tag",
  );

  const { data: documents } = enhancedApi.useListDocumentsByIdsQuery(
    isOpen ? documentIds : skipToken,
  );
  const { data: fetchedTags } = enhancedApi.useListTagsQuery({
    limit: 1000,
    offset: 0,
  });
  const { data: collections } = enhancedApi.useListCollectionsQuery({
    limit: 1000,
    offset: 0,
  });

  const [tagsToAdd, setTagsToAdd] = useState<ApiTag[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<ApiTag[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTagsToAdd([]);
      setTagsToRemove([]);
    }
  }, [isOpen]);

  const allTagsWithUsage = useMemo(() => {
    if (!documents) return [];
    const n = documents.length;

    const tagsMap: Record<string, ApiTag & { usageCount: number }> = {};
    fetchedTags?.items.forEach((tag) => {
      tagsMap[tagToString(tag)] = { ...tag, usageCount: 0 };
    });
    documents.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const k = tagToString(tag);
        if (!(k in tagsMap)) tagsMap[k] = { ...tag, usageCount: 0 };
      });
    });
    tagsToAdd.forEach((tag) => {
      const k = tagToString(tag);
      if (!(k in tagsMap)) tagsMap[k] = { ...tag, usageCount: 0 };
    });

    return Object.values(tagsMap).map((tag) => {
      const k = tagToString(tag);
      const originalCount = documents.filter((doc) =>
        doc.tags.some((t) => tagToString(t) === k),
      ).length;
      const pendingAdd = tagsToAdd.some((t) => tagToString(t) === k);
      const pendingRemove = tagsToRemove.some((t) => tagToString(t) === k);
      return {
        ...tag,
        usageCount: pendingAdd ? n : pendingRemove ? 0 : originalCount,
      };
    });
  }, [documents, fetchedTags, tagsToAdd, tagsToRemove]);

  const tags = useMemo(() => {
    return allTagsWithUsage.filter(
      (tag) =>
        tag.type !== "collection" &&
        tag.type !== "meta" &&
        tag.key !== "collection",
    );
  }, [allTagsWithUsage]);

  const sharedTags = useMemo(() => {
    return tags.filter((tag) => tag.usageCount === documents?.length);
  }, [tags, documents]);

  const sharedCollections = useMemo(() => {
    return allTagsWithUsage.filter(
      (tag) =>
        (tag.key === "collection" || tag.type === "collection") &&
        tag.usageCount === documents?.length,
    );
  }, [allTagsWithUsage, documents]);

  const [collectionFilter, setCollectionFilter] = useState("");
  const [query, setQuery] = useState("");

  const filteredCollections = useMemo(() => {
    const lowerFilter = collectionFilter.toLowerCase();
    return (
      collections?.items.filter(
        (collection) =>
          collection.type === "static" &&
          collection.name.toLowerCase().includes(lowerFilter),
      ) || []
    );
  }, [collections, collectionFilter]);

  const toggleTag = useCallback(
    (tag: ApiTag) => {
      const key = tagToString(tag);
      const isShared =
        sharedTags.some((t) => tagToString(t) === key) ||
        sharedCollections.some((t) => tagToString(t) === key);
      const isPendingAdd = tagsToAdd.some((t) => tagToString(t) === key);
      const isPendingRemove = tagsToRemove.some((t) => tagToString(t) === key);

      if (isShared && !isPendingRemove) {
        setTagsToRemove((prev) => [...prev, tag]);
      } else if (isShared && isPendingRemove) {
        setTagsToRemove((prev) => prev.filter((t) => tagToString(t) !== key));
      } else if (!isShared && isPendingAdd) {
        setTagsToAdd((prev) => prev.filter((t) => tagToString(t) !== key));
      } else {
        setTagsToAdd((prev) => [
          ...prev,
          { key: tag.key, value: tag.value, type: tag.type },
        ]);
      }
    },
    [sharedTags, sharedCollections, tagsToAdd, tagsToRemove],
  );

  const onSubmit = useCallback(
    (query: string) => {
      toggleTag(stringToTag(query));
      setQuery("");
    },
    [toggleTag],
  );

  const [bulkEditDocuments, { isLoading }] =
    enhancedApi.useBulkEditDocumentsMutation();

  const onBulkEditConfirm = useCallback(() => {
    bulkEditDocuments({
      documentIds,
      tagsToAdd,
      tagsToRemove,
    }).then(() => {
      onConfirm();
    });
  }, [tagsToAdd, tagsToRemove, bulkEditDocuments, documentIds, onConfirm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onAbort}
      title={t("pages.gallery.bulkEditDocuments", {
        count: documentIds.length,
      })}
    >
      <div className="flex flex-col gap-2 min-h-[400px]">
        <ButtonSelector
          options={[
            { label: t("pages.gallery.editTags"), value: "tag" },
            { label: t("pages.gallery.editCollections"), value: "collection" },
          ]}
          value={selectedAction}
          onSelected={(value) =>
            setSelectedAction(value as "collection" | "tag")
          }
          multiChoice={false}
        />
        <div className="flex-grow flex flex-col gap-2">
          {selectedAction === "tag" ? (
            <>
              <TagInput
                className="z-100"
                onChange={setQuery}
                placeholder={t("pages.gallery.searchTag")}
                value={query}
                onSubmit={onSubmit}
              />
              <TagList tags={tags} onClick={toggleTag} />
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder={t("collections.addForm.filterPlaceholder")}
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 w-full"
              />
              {filteredCollections.map((collection) => (
                <CollectionCard
                  collection={collection}
                  key={collection.id}
                  isSelected={sharedCollections.some(
                    (tag) =>
                      tag.key === "collection" && tag.value === collection.id,
                  )}
                  onClick={() => {
                    const tag = {
                      key: "collection",
                      value: collection.id,
                      type: "collection",
                    } as ApiTag;
                    toggleTag(tag);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={onBulkEditConfirm}
          className="self-end flex flex-row items-center gap-2"
          disabled={isLoading || (!tagsToAdd.length && !tagsToRemove.length)}
        >
          {isLoading ? <BiLoader className="animate-spin" /> : undefined}
          {t("pages.gallery.bulkEditConfirm", { count: documentIds.length })}
        </Button>
      </div>
    </Modal>
  );
};
