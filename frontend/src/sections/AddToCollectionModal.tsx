import { useTranslation } from "react-i18next";
import { Modal } from "../components/Modal";
import { AddDocumentToCollection } from "./AddDocumentToCollection";

type Props = {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
};

export const AddToCollectionModal = ({
  documentId,
  isOpen,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("collections.addForm.add")}
    >
      <AddDocumentToCollection documentId={documentId} />
    </Modal>
  );
};
