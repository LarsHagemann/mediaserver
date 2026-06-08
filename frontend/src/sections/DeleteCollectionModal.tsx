import { useTranslation } from "react-i18next";
import type { Collection } from "../app/api";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  deletingCollection?: Collection | undefined;
};

export const DeleteCollectionModal = ({
  isOpen,
  onClose,
  onDelete,
  deletingCollection,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
          <Button variant="ghost" onClick={onClose}>
            {t("collections.form.cancel")}
          </Button>
          <Button
            className="bg-danger hover:bg-danger-hover"
            onClick={onDelete}
          >
            {t("collections.deleteModal.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
