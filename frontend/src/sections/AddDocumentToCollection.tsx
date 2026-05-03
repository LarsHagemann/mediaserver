import { useCallback, useMemo, useState } from "react";
import { CollectionCard } from "./CollectionCard";
import { enhancedApi } from "../app/enhancedApi";

type Props = {
  documentId: string;
};

export const AddDocumentToCollection: React.FC<Props> = ({ documentId }) => {
  const { data: collectionsData } = enhancedApi.useListCollectionsQuery({
    limit: 100,
    offset: 0,
    type: "static",
  });
  const { data: documentData } =
    enhancedApi.useGetDocumentTagsQuery(documentId);

  const [loadingCollection, setLoadingCollection] = useState<string | null>(
    null,
  );

  const [addCollectionMember] = enhancedApi.useAddCollectionMemberMutation();
  const [removeCollectionMember] =
    enhancedApi.useRemoveCollectionMemberMutation();

  const tags = useMemo(() => documentData?.tags || [], [documentData]);
  const collections = useMemo(
    () => collectionsData?.items || [],
    [collectionsData],
  );

  const documentCollectionIds = useMemo(
    () =>
      new Set(
        tags.filter((tag) => tag.key === "collection").map((tag) => tag.value),
      ),
    [tags],
  );

  const onToggle = useCallback(
    (collectionId: string) => {
      setLoadingCollection(collectionId);
      if (documentCollectionIds.has(collectionId)) {
        removeCollectionMember({ collectionId, documentId }).finally(() => {
          setLoadingCollection(null);
        });
      } else {
        addCollectionMember({ collectionId, documentId }).finally(() => {
          setLoadingCollection(null);
        });
      }
    },
    [
      addCollectionMember,
      removeCollectionMember,
      documentCollectionIds,
      documentId,
    ],
  );

  return (
    <div className="flex flex-col gap-2 w-full overflow-y-auto">
      {collections.map((collection) => (
        <div className="flex flex-row items-center gap-2" key={collection.id}>
          <CollectionCard
            collection={collection}
            onClick={() => {
              onToggle(collection.id);
            }}
            isSelected={documentCollectionIds.has(collection.id)}
            isLoading={loadingCollection === collection.id}
          />
        </div>
      ))}
    </div>
  );
};
