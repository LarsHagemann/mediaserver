import { twMerge } from "tailwind-merge";
import { enhancedApi } from "../app/enhancedApi";
import { TagList } from "../components/TagList";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router";
import { TagInput } from "./TagInput";
import type { ApiTag } from "../app/api";
import { tagToString } from "../util/tag";
import { useTranslation } from "react-i18next";
import { DocumentRender } from "../components/DocumentRender";
import { preventInputHandling } from "../util/preventInputHandling";
import { useSwipeable } from "react-swipeable";
import { useIsMobileScreen } from "../hooks/useIsMobileScreen";
import { AddDocumentToCollection } from "./AddDocumentToCollection";
import { DocumentAccessPanel } from "./DocumentAccessPanel";
import { Modal } from "../components/Modal";

type Tab = "tags" | "collections" | "access";

type Props = {
  id: string;
  mimeType?: string;
  nextPreviewImage: () => void;
  previousPreviewImage: () => void;
  activeTab: Tab | null;
  setActiveTab: Dispatch<SetStateAction<Tab | null>>;
  canManageAccess: boolean;
};

export const DocumentPreview = ({
  id,
  mimeType,
  nextPreviewImage,
  previousPreviewImage,
  activeTab,
  setActiveTab,
  canManageAccess,
}: Props) => {
  const [tagInput, setTagInput] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (preventInputHandling()) {
        return;
      }

      if (event.key === "t") {
        setActiveTab((tab) => (tab === "tags" ? null : "tags"));
      }
    };

    window.addEventListener("keydown", keyDownHandler);
    return () => {
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, [setActiveTab]);

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

  const tags = useMemo(
    () => data?.tags.filter((tag) => tag.key !== "collection") || [],
    [data],
  );

  const handlers = useSwipeable({
    onSwipedLeft: () => nextPreviewImage(),
    onSwipedRight: () => previousPreviewImage(),
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  const isMobile = useIsMobileScreen();
  const panelOpen = activeTab !== null;

  const tabBar = (
    <div className="flex border-b border-border flex-shrink-0">
      <button
        className={twMerge(
          "flex-1 py-2 text-sm font-medium transition-colors",
          activeTab === "tags"
            ? "border-b-2 border-accent text-text-primary"
            : "text-text-muted hover:text-text-primary",
        )}
        onClick={() => setActiveTab("tags")}
      >
        {t("document.tabs.tags")}
      </button>
      <button
        className={twMerge(
          "flex-1 py-2 text-sm font-medium transition-colors",
          activeTab === "collections"
            ? "border-b-2 border-accent text-text-primary"
            : "text-text-muted hover:text-text-primary",
        )}
        onClick={() => setActiveTab("collections")}
      >
        {t("document.tabs.collections")}
      </button>
      {canManageAccess && (
        <button
          className={twMerge(
            "flex-1 py-2 text-sm font-medium transition-colors",
            activeTab === "access"
              ? "border-b-2 border-accent text-text-primary"
              : "text-text-muted hover:text-text-primary",
          )}
          onClick={() => setActiveTab("access")}
        >
          {t("document.tabs.access")}
        </button>
      )}
    </div>
  );

  const tabContent = (
    <>
      {activeTab === "tags" && (
        <>
          <div className="flex-1 w-full overflow-y-auto">
            <TagList
              tags={tags}
              onClick={(tag) =>
                navigate(`?q=${tag.key}${tag.value ? `:${tag.value}` : ""}`)
              }
              onDelete={removeTagFromDocument}
            />
          </div>
          <div className="w-full flex-shrink-0">
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
        </>
      )}
      {activeTab === "collections" && <AddDocumentToCollection documentId={id} />}
      {activeTab === "access" && <DocumentAccessPanel documentId={id} />}
    </>
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className={twMerge(
          "absolute top-0 left-0 h-full z-0 bg-bg-base duration-200",
          panelOpen && !isMobile ? "w-3/4" : "w-full",
        )}
        {...handlers}
      >
        <DocumentRender documentId={id} mimeType={mimeType} />
      </div>
      {isMobile ? (
        <Modal isOpen={panelOpen} onClose={() => setActiveTab(null)} title="">
          <div className="flex flex-col min-h-[300px] max-h-[60vh]">
            {tabBar}
            <div className="flex flex-col flex-1 gap-2 p-2 overflow-y-auto">
              {tabContent}
            </div>
          </div>
        </Modal>
      ) : (
        <div
          className={twMerge(
            "h-full top-0 w-1/4 absolute flex flex-col z-20 bg-surface-1 border-l border-border duration-200",
            panelOpen ? "right-0" : "-right-1/4",
          )}
        >
          {tabBar}
          <div className="flex flex-col flex-1 gap-2 p-2 overflow-y-auto">
            {tabContent}
          </div>
        </div>
      )}
    </div>
  );
};
