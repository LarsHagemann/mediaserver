import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";
import { enhancedApi } from "../app/enhancedApi";
import type { Collection } from "../app/api";
import { CollectionCard } from "../sections/CollectionCard";
import { CollectionFormModal } from "../sections/CollectionFormModal";
import { usePageOffsetAndLimitParams } from "../hooks/usePageOffsetAndLimitParams";
import { Pagination } from "../components/Pagination";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";

export const CollectionsPage = () => {
  const { t } = useTranslation();
  const { limit, offset, page, setPage } = usePageOffsetAndLimitParams(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<
    Collection | undefined
  >(undefined);
  const [deletingCollection, setDeletingCollection] = useState<
    Collection | undefined
  >(undefined);

  const { data } = enhancedApi.useListCollectionsQuery({ limit, offset });
  const [createCollection] = enhancedApi.useCreateCollectionMutation();
  const [updateCollection] = enhancedApi.useUpdateCollectionMutation();
  const [deleteCollection] = enhancedApi.useDeleteCollectionMutation();

  const total = useMemo(() => data?.total ?? 0, [data?.total]);
  const favorites = useMemo(
    () => data?.items.filter((c) => c.isFavorite) ?? [],
    [data],
  );
  const nonFavorites = useMemo(
    () => data?.items.filter((c) => !c.isFavorite) ?? [],
    [data],
  );

  const handleOpenCreate = () => {
    setEditingCollection(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingCollection) {
      await deleteCollection(deletingCollection.id);
      setDeletingCollection(undefined);
    }
  };

  const handleToggleFavorite = async (collection: Collection) => {
    await updateCollection({
      id: collection.id,
      name: collection.name,
      description: collection.description ?? null,
      filterExpression: collection.filterExpression,
      isFavorite: !collection.isFavorite,
    });
  };

  const handleSave = async (saveData: {
    name: string;
    description: string | null;
    filterExpression: string;
    isFavorite: boolean;
    type: "dynamic" | "static";
  }) => {
    if (editingCollection) {
      await updateCollection({ ...saveData, id: editingCollection.id });
    } else {
      await createCollection(saveData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("collections.title")}
        </h1>
        <Button onClick={handleOpenCreate}>
          + {t("collections.newCollection")}
        </Button>
      </div>

      {data?.items.length === 0 && (
        <div className="text-text-muted text-center py-12">
          {t("collections.empty")}
        </div>
      )}

      {favorites.length > 0 && (
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-warning mb-3">
            <FaStar />
            {t("collections.favorites")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={handleEdit}
                onDelete={setDeletingCollection}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {nonFavorites.length > 0 && (
        <div>
          {favorites.length > 0 && (
            <h2 className="text-lg font-semibold text-text-secondary mb-3">
              {t("collections.all")}
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonFavorites.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEdit={handleEdit}
                onDelete={setDeletingCollection}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      <Pagination
        total={total}
        limit={limit}
        currentPage={page}
        onPageChange={setPage}
        className="mt-6"
      />

      <CollectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialCollection={editingCollection}
      />

      <Modal
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(undefined)}
        title={t("collections.deleteModal.title")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary">
            {deletingCollection?.type === "static"
              ? t("collections.deleteModal.bodyStatic", {
                  name: deletingCollection.name,
                })
              : t("collections.deleteModal.body", {
                  name: deletingCollection?.name,
                })}
          </p>
          {deletingCollection?.type === "static" && (
            <p className="text-warning text-sm">
              {t("collections.deleteModal.staticWarning")}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeletingCollection(undefined)}
            >
              {t("collections.form.cancel")}
            </Button>
            <Button
              className="bg-danger hover:bg-danger-hover"
              onClick={handleDeleteConfirm}
            >
              {t("collections.deleteModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
