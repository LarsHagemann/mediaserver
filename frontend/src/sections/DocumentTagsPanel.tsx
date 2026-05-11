import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { enhancedApi } from "../app/enhancedApi";
import type { ApiTag } from "../app/api";
import { TagList } from "../components/TagList";
import { TagInput } from "./TagInput";
import { tagToString } from "../util/tag";

export const DocumentTagsPanel = ({ documentId }: { documentId: string }) => {
  const [tagInput, setTagInput] = useState("");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = enhancedApi.useGetDocumentTagsQuery(documentId);
  const [addTag] = enhancedApi.useAddTagToDocumentMutation();
  const [removeTag] = enhancedApi.useRemoveTagFromDocumentMutation();

  const tags = useMemo(
    () => data?.tags.filter((tag) => tag.key !== "collection") ?? [],
    [data],
  );

  const addTagToDocument = useCallback(
    (tag: string) => addTag({ documentId, tag }),
    [addTag, documentId],
  );

  const removeTagFromDocument = useCallback(
    (tag: ApiTag) => removeTag({ documentId, tag: tagToString(tag) }),
    [removeTag, documentId],
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <TagList
          tags={tags}
          onClick={(tag) =>
            navigate(`?q=${tag.key}${tag.value ? `:${tag.value}` : ""}`)
          }
          onDelete={removeTagFromDocument}
        />
      </div>
      <div className="flex-shrink-0 border-t border-border">
        <TagInput
          value={tagInput}
          onChange={setTagInput}
          onSubmit={addTagToDocument}
          direction="up"
          className="text-text-primary"
          clearOnSubmit
          placeholder={t("document.addTagPlaceholder")}
        />
      </div>
    </div>
  );
};
