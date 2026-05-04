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

  const [workingDocuments, setWorkingDocuments] =
    useState<typeof documents>(undefined);

  useEffect(() => {
    if (documents) {
      setWorkingDocuments(
        JSON.parse(JSON.stringify(documents)) as typeof documents,
      );
    }
  }, [documents]);

  const allTags = useMemo(() => {
    if (!fetchedTags) return workingDocuments?.flatMap((doc) => doc.tags) ?? [];
    if (!workingDocuments) return fetchedTags.items;

    const tagsMap: Record<string, (typeof fetchedTags.items)[0]> = {};
    fetchedTags.items.forEach((tag) => {
      tagsMap[`${tag.key}:${tag.value}`] = tag;
    });

    workingDocuments.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const key = `${tag.key}:${tag.value}`;
        if (!(key in tagsMap)) {
          tagsMap[key] = {
            ...tag,
            usageCount: workingDocuments.filter((d) =>
              d.tags.some((t) => t.key === tag.key && t.value === tag.value),
            ).length,
          };
        }
      });
    });

    return Object.values(tagsMap);
  }, [fetchedTags, workingDocuments]);

  const allTagsWithUsage = useMemo(() => {
    if (!workingDocuments)
      return allTags.map((tag) => ({ ...tag, usageCount: 0 }));
    return allTags.map((tag) => ({
      ...tag,
      usageCount: workingDocuments.filter((doc) =>
        doc.tags.some((t) => t.key === tag.key && t.value === tag.value),
      ).length,
    }));
  }, [allTags, workingDocuments]);

  const tags = useMemo(() => {
    return allTagsWithUsage.filter(
      (tag) =>
        tag.type !== "collection" &&
        tag.type !== "meta" &&
        tag.key !== "collection",
    );
  }, [allTagsWithUsage]);

  // Tags shared by every document
  const sharedTags = useMemo(() => {
    return tags.filter((tag) => tag.usageCount === workingDocuments?.length);
  }, [tags, workingDocuments]);

  // Collections shared by every document
  const sharedCollections = useMemo(() => {
    return allTagsWithUsage.filter(
      (tag) =>
        (tag.key === "collection" || tag.type === "collection") &&
        tag.usageCount === workingDocuments?.length,
    );
  }, [allTagsWithUsage, workingDocuments]);

  const [collectionFilter, setCollectionFilter] = useState("");
  const [query, setQuery] = useState("");

  const filteredCollections = useMemo(() => {
    const lowerFilter = collectionFilter.toLowerCase();
    return (
      collections?.items.filter((collection) =>
        collection.name.toLowerCase().includes(lowerFilter),
      ) || []
    );
  }, [collections, collectionFilter]);

  const onSubmit = useCallback(
    (query: string) => {
      if (sharedTags.some((tag) => `${tag.key}:${tag.value}` === query)) {
        setWorkingDocuments((docs) => {
          docs?.forEach((doc) => {
            doc.tags = doc.tags.filter(
              (tag) => `${tag.key}:${tag.value}` !== query,
            );
          });
          return [...(docs ?? [])];
        });
      } else {
        const [key, value] = query.split(":");
        setWorkingDocuments((docs) => {
          docs?.forEach((doc) => {
            if (
              !doc.tags.some((tag) => tag.key === key && tag.value === value)
            ) {
              doc.tags.push({ key, value, type: "default" });
            }
          });
          return [...(docs ?? [])];
        });
      }
      setQuery("");
    },
    [sharedTags],
  );

  const toggleTag = useCallback(
    (tag: ApiTag) => {
      if (sharedTags.some((t) => t.key === tag.key && t.value === tag.value)) {
        setWorkingDocuments((docs) => {
          docs?.forEach((doc) => {
            doc.tags = doc.tags.filter(
              (t) => !(t.key === tag.key && t.value === tag.value),
            );
          });
          return [...(docs ?? [])];
        });
      } else if (
        sharedCollections.some(
          (t) => t.key === "collection" && t.value === tag.value,
        )
      ) {
        setWorkingDocuments((docs) => {
          docs?.forEach((doc) => {
            doc.tags = doc.tags.filter(
              (t) => !(t.key === "collection" && t.value === tag.value),
            );
          });
          return [...(docs ?? [])];
        });
      } else {
        setWorkingDocuments((docs) => {
          docs?.forEach((doc) => {
            if (
              !doc.tags.some((t) => t.key === tag.key && t.value === tag.value)
            ) {
              doc.tags.push({
                key: tag.key,
                value: tag.value,
                type: tag.type,
              });
            }
          });
          return [...(docs ?? [])];
        });
      }
    },
    [sharedTags, sharedCollections],
  );

  const diff: { added: ApiTag[]; removed: ApiTag[] } = useMemo(() => {
    if (!documents || !workingDocuments) {
      return { added: [], removed: [] };
    }

    const added: ApiTag[] = [];
    const removed: ApiTag[] = [];

    const tagKeySet = new Set<string>();

    workingDocuments.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const key = `${tag.key}:${tag.value}`;
        tagKeySet.add(key);
      });
    });

    documents.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const key = `${tag.key}:${tag.value}`;
        if (!tagKeySet.has(key)) {
          removed.push(tag);
        }
      });
    });

    workingDocuments.forEach((doc) => {
      doc.tags.forEach((tag) => {
        const key = `${tag.key}:${tag.value}`;
        if (
          !documents.some((d) =>
            d.tags.some((t) => `${t.key}:${t.value}` === key),
          )
        ) {
          added.push(tag);
        }
      });
    });

    return { added, removed };
  }, [documents, workingDocuments]);

  const [bulkEditDocuments, { isLoading }] =
    enhancedApi.useBulkEditDocumentsMutation();

  const onBulkEditConfirm = useCallback(() => {
    bulkEditDocuments({
      documentIds,
      tagsToAdd: diff.added,
      tagsToRemove: diff.removed,
    }).then(() => {
      onConfirm();
    });
  }, [diff, bulkEditDocuments, documentIds, onConfirm]);

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
          disabled={isLoading || (!diff.added.length && !diff.removed.length)}
        >
          {isLoading ? <BiLoader className="animate-spin" /> : undefined}
          {t("pages.gallery.bulkEditConfirm", { count: documentIds.length })}
        </Button>
      </div>
    </Modal>
  );
};
