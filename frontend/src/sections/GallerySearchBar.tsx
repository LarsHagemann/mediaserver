import { useTranslation } from "react-i18next";
import { MdEdit } from "react-icons/md";
import { Button } from "../components/Button";
import { TagInput } from "./TagInput";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
};

export const GallerySearchBar = ({
  value,
  onChange,
  onSubmit,
  editMode,
  onToggleEditMode,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row gap-2 items-center">
      <TagInput
        value={value}
        onChange={onChange}
        onValidChange={() => {}}
        onSubmit={onSubmit}
        className="flex flex-row p-2 w-full"
        placeholder={t("pages.gallery.tagInputPlaceholder")}
        blurOnSubmit
      />
      <Button
        className="mr-2 flex flex-row gap-2 items-center"
        onClick={onToggleEditMode}
        variant={editMode ? "primary" : "outline"}
      >
        <MdEdit className="inline text-md" />
        {t("pages.gallery.bulkEdit")}
      </Button>
    </div>
  );
};
