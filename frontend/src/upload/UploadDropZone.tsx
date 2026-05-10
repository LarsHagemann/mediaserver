import { useTranslation } from "react-i18next";
import { MdFileUpload, MdFolderOpen } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { Button } from "../components/Button";

type Props = {
  isDragging: boolean;
  hasFiles: boolean;
  onChooseFiles: () => void;
};

export const UploadDropZone = ({ isDragging, hasFiles, onChooseFiles }: Props) => {
  const { t } = useTranslation();

  const borderClass = isDragging
    ? "border-accent bg-accent-dim"
    : "border-border hover:border-border-strong";

  if (!hasFiles) {
    return (
      <div
        className={twMerge(
          "bg-surface-1 rounded-lg border-2 border-dashed p-12 flex flex-col items-center gap-5 cursor-pointer transition-colors",
          borderClass,
        )}
        onClick={onChooseFiles}
      >
        <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center">
          <MdFileUpload size={28} className="text-text-secondary" />
        </div>
        <div className="text-center">
          <div className="text-xl font-semibold">
            {t("pages.upload.dropZoneTitle")}
          </div>
          <div className="text-text-muted mt-1 text-sm">
            {t("pages.upload.dropZoneSubtitle")}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full max-w-xs">
          <hr className="flex-1 border-border" />
          <span className="text-text-faint text-xs uppercase tracking-wider">
            {t("pages.upload.or")}
          </span>
          <hr className="flex-1 border-border" />
        </div>
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onChooseFiles();
          }}
        >
          <MdFolderOpen size={16} /> {t("pages.upload.chooseFiles")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "bg-surface-1 rounded-lg border-2 border-dashed px-6 py-4 flex items-center gap-4 cursor-pointer transition-colors",
        borderClass,
      )}
      onClick={onChooseFiles}
    >
      <MdFileUpload size={20} className="text-text-muted shrink-0" />
      <span className="text-sm text-text-muted flex-1">
        {t("pages.upload.dropZoneTitle")}
      </span>
      <Button
        variant="secondary"
        className="flex items-center gap-2 text-sm shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onChooseFiles();
        }}
      >
        <MdFolderOpen size={15} /> {t("pages.upload.chooseFiles")}
      </Button>
    </div>
  );
};
