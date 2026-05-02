import { useTranslation } from "react-i18next";
import { Modal } from "../components/Modal";
import { enhancedApi } from "../app/enhancedApi";
import { useCallback, useMemo, useState } from "react";
import { CollectionCard } from "./CollectionCard";
import { BiLoader } from "react-icons/bi";

type Props = {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToCollectionModal = ({ documentId, isOpen, onClose }: Props) => {
  const { t } = useTranslation();

  const { data: collectionsData } = enhancedApi.useListCollectionsQuery({ limit: 100, offset: 0, type: 'static' });
  const { data: documentData } = enhancedApi.useGetDocumentTagsQuery(documentId);

  const [loadingCollection, setLoadingCollection] = useState<string | null>(null);

  const [addCollectionMember] = enhancedApi.useAddCollectionMemberMutation();
  const [removeCollectionMember] = enhancedApi.useRemoveCollectionMemberMutation();

  const tags = useMemo(() => documentData?.tags || [], [documentData]);
  const collections = useMemo(() => collectionsData?.items || [], [collectionsData]);

  const documentCollectionIds = useMemo(
    () =>
      new Set(
        tags
          .filter((tag) => tag.key === "collection")
          .map((tag) => tag.value),
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
    [addCollectionMember, removeCollectionMember, documentCollectionIds, documentId],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("collections.addForm.add")}
    >
      <div className="flex flex-col gap-2">
        {collections.map((collection) => (
          <div className="flex flex-row items-center gap-2" key={collection.id}>
            {loadingCollection === collection.id ? (
              <BiLoader className="animate-spin" />
            ) : (
              <input
                type="checkbox"
                checked={documentCollectionIds.has(collection.id)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                onChange={() => onToggle(collection.id)}
              />
            )}
            <CollectionCard
              collection={collection}
              onClick={() => {
                onToggle(collection.id);
              }}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};
