import { useState, useEffect } from "react";
import { Modal } from "../components/Modal";
import { TagInput } from "./TagInput";
import { enhancedApi } from "../app/enhancedApi";
import type { Collection, CollectionType } from "../app/api";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";

type SaveData = {
  name: string;
  description: string | null;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
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
  const [type, setType] = useState<CollectionType>("dynamic");

  const isEditing = !!initialCollection;
  const effectiveType = isEditing ? initialCollection.type : type;
  const showTypeSelector = !isEditing && !initialFilterExpression;

  useEffect(() => {
    if (isOpen) {
      setName(initialCollection?.name ?? "");
      setDescription(initialCollection?.description ?? "");
      setFilterExpression(
        initialCollection?.filterExpression ?? initialFilterExpression,
      );
      setIsFilterValid(true);
      setType(initialCollection?.type ?? "dynamic");
    }
  }, [isOpen, initialCollection, initialFilterExpression]);

  const { data: previewData } = enhancedApi.useListDocumentsQuery(
    { limit: 1, offset: 0, query: filterExpression },
    {
      skip:
        effectiveType === "static" || !isFilterValid || filterExpression === "",
    },
  );

  const isValid =
    name.trim().length > 0 && (effectiveType === "static" || isFilterValid);

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      filterExpression,
      isFavorite: initialCollection?.isFavorite ?? false,
      type: effectiveType,
    });
  };

  const title = isEditing
    ? t("collections.editCollection")
    : t("collections.newCollection");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {showTypeSelector && (
          <div>
            <label className="block text-sm text-text-muted mb-1">
              {t("collections.form.type")}
            </label>
            <div className="flex rounded overflow-hidden border border-border-subtle">
              <button
                type="button"
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "dynamic"
                    ? "bg-accent text-text-primary"
                    : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                }`}
                onClick={() => setType("dynamic")}
              >
                {t("collections.form.typeDynamic")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "static"
                    ? "bg-accent text-text-primary"
                    : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                }`}
                onClick={() => setType("static")}
              >
                {t("collections.form.typeStatic")}
              </button>
            </div>
            <p className="text-xs text-text-faint mt-1">
              {type === "dynamic"
                ? t("collections.form.typeDynamicHint")
                : t("collections.form.typeStaticHint")}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm text-text-muted mb-1">
            {t("collections.form.name")} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-2 border border-border-subtle rounded p-2 text-text-primary outline-none focus:border-accent-hover"
            placeholder={t("collections.form.namePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">
            {t("collections.form.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-2 border border-border-subtle rounded p-2 text-text-primary outline-none focus:border-accent-hover resize-none h-20"
            placeholder={t("collections.form.descriptionPlaceholder")}
          />
        </div>

        {effectiveType === "dynamic" && (
          <div>
            <label className="block text-sm text-text-muted mb-1">
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
              <p className="text-sm text-text-muted mt-1">
                {t("collections.docCount", { count: previewData?.total ?? 0 })}
              </p>
            )}
          </div>
        )}

        {effectiveType === "static" && isEditing && (
          <p className="text-xs text-text-faint">
            {t("collections.form.staticFilterNote")}
          </p>
        )}

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
