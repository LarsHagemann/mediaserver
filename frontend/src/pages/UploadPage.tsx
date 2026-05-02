import { useTranslation } from "react-i18next";
import { useUploadContext } from "../upload/UploadContext";
import { TagInput } from "../sections/TagInput";
import { useState } from "react";
import { TagList } from "../components/TagList";
import type { ApiTag } from "../app/api";
import { stringToTag, tagToString } from "../util/tag";
import { FileUploadView } from "../sections/FileUploadView";

export const UploadPage = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>("");

  const [tags, setTags] = useState<ApiTag[]>([]);

  const { markFileAsToBeUploaded } = useUploadContext();

  return (
    <div
      className="flex flex-col h-full p-4 gap-2"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => {
          markFileAsToBeUploaded(file, tags);
        });
      }}
    >
      <h1 className="text-3xl">
        <strong>{t("pages.upload.title")}</strong>
      </h1>
      <p>{t("pages.upload.description")}</p>
      <TagInput
        clearOnSubmit
        value={value}
        onChange={setValue}
        onSubmit={(tag) => {
          if (tag.trim() === "") return;
          setTags((prev) => [...prev, stringToTag(tag)]);
        }}
        className=""
        placeholder={t("pages.upload.tagInputPlaceholder")}
      />
      <TagList
        tags={tags}
        onDelete={(tag) => {
          setTags((prev) =>
            prev.filter((t) => tagToString(tag) !== tagToString(t)),
          );
        }}
      />
      <input
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (!files) return;
          Array.from(files).forEach((file) => {
            markFileAsToBeUploaded(file, tags);
          });
        }}
        id="fileInput"
      />
      <div
        className="flex flex-col bg-surface-2 grow justify-center text-center rounded-sm cursor-pointer"
        onClick={() => {
          (document.querySelector("#fileInput") as HTMLInputElement).click();
        }}
      >
        {t("pages.upload.dropFilesHereOrClickToSelect")}
      </div>
      <FileUploadView
        className="sm:hidden block w-full left-0"
        hideWhenNoFiles={false}
      />
    </div>
  );
};
