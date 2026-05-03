import { twMerge } from "tailwind-merge";
import { enhancedApi } from "../app/enhancedApi";
import { TagList } from "../components/TagList";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { TagInput } from "./TagInput";
import type { ApiTag } from "../app/api";
import { tagToString } from "../util/tag";
import { useTranslation } from "react-i18next";
import { DocumentRender } from "../components/DocumentRender";
import { preventInputHandling } from "../util/preventInputHandling";
import { useSwipeable } from "react-swipeable";

type Props = {
  id: string;
  mimeType?: string;
  nextPreviewImage: () => void;
  previousPreviewImage: () => void;
};

export const DocumentPreview = ({ id, mimeType, nextPreviewImage, previousPreviewImage }: Props) => {
  const [tagInput, setTagInput] = useState("");

  const { t } = useTranslation();

  const [tagListOpen, setTagListOpen] = useState(false);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (preventInputHandling()) {
        return;
      }

      if (event.key === "t") {
        setTagListOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", keyDownHandler);
    return () => {
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, []);

  const { data } = enhancedApi.useGetDocumentTagsQuery(id);

  const navigate = useNavigate();

  const [addTag] = enhancedApi.useAddTagToDocumentMutation();
  const [removeTag] = enhancedApi.useRemoveTagFromDocumentMutation();

  const addTagToDocument = useCallback(
    (tag: string) => {
      addTag({ documentId: id, tag });
    },
    [addTag, id],
  );

  const removeTagFromDocument = useCallback(
    (tag: ApiTag) => {
      removeTag({ documentId: id, tag: tagToString(tag) });
    },
    [removeTag, id],
  );

  const tags = useMemo(() => data?.tags.filter(tag => tag.key !== "collection") || [], [data]);

  const handlers = useSwipeable({
    onSwipedLeft: () => nextPreviewImage(),
    onSwipedRight: () => previousPreviewImage(),
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div className="relative w-full h-full">
      <div
        className={twMerge(
          "h-1/2 left-0 absolute w-full sm:w-1/4 flex flex-col items-start gap-2 sm:top-0 sm:h-full z-20 bg-surface-1 p-2 border-b-2 border-border duration-200",
          tagListOpen
            ? "bottom-0 sm:left-0"
            : "-bottom-1/2 sm:-bottom-1/2 sm:-left-1/4",
        )}
      >
        <div className="relative flex-col grow w-full overflow-y-auto z-10">
          <TagList
            tags={tags}
            onClick={(tag) =>
              navigate(`?q=${tag.key}${tag.value ? `:${tag.value}` : ""}`)
            }
            onDelete={removeTagFromDocument}
          />
        </div>
        <div className="relative flex-col w-full z-20">
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
      <div
        className={twMerge(
          "absolute sm:top-1/2 z-10 left-[initial] left-[calc(50%-1rem)] bg-surface-2 p-2 border-r-2 border-r-transparent rounded-r-md duration-200 cursor-pointer rotate-270 sm:bottom-[initial] sm:rotate-0",
          tagListOpen
            ? "bottom-[calc(50%-0.5rem)] sm:left-1/4"
            : "-bottom-2 sm:left-0",
        )}
        onClick={() => setTagListOpen((open) => !open)}
      >
        <div
          className={
            tagListOpen
              ? "duration-200 rotate-180"
              : "duration-200 rotate-0"
          }
        >
          &gt;
        </div>
      </div>
      <div
        className={twMerge(
          "absolute top-0 w-full h-full z-0 bg-bg-base duration-200",
          tagListOpen
            ? "h-1/2 sm:h-full sm:w-3/4 sm:left-1/4"
            : "h-full sm:w-full sm:left-0",
        )}
        {...handlers}
      >
        <DocumentRender documentId={id} mimeType={mimeType} />
      </div>
    </div>
  );
};
