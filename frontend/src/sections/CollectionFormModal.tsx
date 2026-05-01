import { useState, useEffect } from "react";
import { Modal } from "../components/Modal";
import { TagInput } from "./TagInput";
import { enhancedApi } from "../app/enhancedApi";
import type { Collection } from "../app/api";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";

type SaveData = {
  name: string;
  description: string | null;
  filterExpression: string;
  isFavorite: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveData) => void;
  initialCollection?: Collection;
  initialFilterExpression?: string;
};

export const CollectionFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialCollection,
  initialFilterExpression = "",
}: Props) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filterExpression, setFilterExpression] = useState("");
  const [isFilterValid, setIsFilterValid] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setName(initialCollection?.name ?? "");
      setDescription(initialCollection?.description ?? "");
      setFilterExpression(
        initialCollection?.filterExpression ?? initialFilterExpression,
      );
      setIsFilterValid(true);
    }
  }, [isOpen, initialCollection, initialFilterExpression]);

  const { data: previewData } = enhancedApi.useListDocumentsQuery(
    { limit: 1, offset: 0, query: filterExpression },
    { skip: !isFilterValid || filterExpression === "" },
  );

  const isValid = name.trim().length > 0 && isFilterValid;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      filterExpression,
      isFavorite: initialCollection?.isFavorite ?? false,
    });
  };

  const title = initialCollection
    ? t("collections.editCollection")
    : t("collections.newCollection");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("collections.form.name")} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500"
            placeholder={t("collections.form.namePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("collections.form.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white outline-none focus:border-blue-500 resize-none h-20"
            placeholder={t("collections.form.descriptionPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("collections.form.filterExpression")} *
          </label>
          <TagInput
            value={filterExpression}
            onChange={setFilterExpression}
            onSubmit={() => {}}
            onValidChange={setIsFilterValid}
            placeholder={t("collections.form.filterPlaceholder")}
          />
          {isFilterValid && filterExpression !== "" && (
            <p className="text-sm text-gray-400 mt-1">
              {t("collections.docCount", { count: previewData?.total ?? 0 })}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("collections.form.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {t("collections.form.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
