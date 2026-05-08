import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";

type Props = {
  editDocuments: Set<string>;
  entirePageSelected: boolean;
  onTogglePage: () => void;
  onClearSelection: () => void;
  onOpenBulkEdit: () => void;
  onCancel: () => void;
};

export const EditModePanel = ({
  editDocuments,
  entirePageSelected,
  onTogglePage,
  onClearSelection,
  onOpenBulkEdit,
  onCancel,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="px-2 flex flex-col bg-surface-1 text-sm text-text-primary p-2 gap-2">
      <div className="flex flex-row gap-2 items-center justify-start flex-wrap">
        <div className="flex flex-row gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-accent-subtle  border-accent border-3" />
          <span>{t("pages.gallery.editMode")}</span>
        </div>
        <div className="flex flex-grow justify-end">
          <span
            className="underline text-accent-subtle cursor-pointer"
            onClick={onCancel}
          >
            {t("pages.gallery.cancelEdit")}
          </span>
        </div>
      </div>
      <hr className="border-accent-subtle" />
      <div className="flex flex-row gap-2 items-center justify-start flex-wrap">
        <div className="rounded-lg bg-accent-subtle px-2">
          {editDocuments.size} {t("pages.gallery.selected")}
        </div>
        <Button variant="outline" className="p-0.5 px-1" onClick={onTogglePage}>
          {entirePageSelected
            ? t("pages.gallery.deselectPage")
            : t("pages.gallery.selectPage")}
        </Button>
        <Button
          variant="outline"
          className="p-0.5 px-1"
          onClick={onClearSelection}
        >
          {t("pages.gallery.clearSelection")}
        </Button>
        <Button
          variant="primary"
          className="p-0.5 px-1"
          onClick={onOpenBulkEdit}
          disabled={editDocuments.size === 0}
        >
          {t("pages.gallery.bulkEdit")}
        </Button>
        <div className="flex flex-grow justify-end text-text-muted">
          {t("pages.gallery.editDescription")}
        </div>
      </div>
    </div>
  );
};
