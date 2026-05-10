import type { SkipToken } from "@reduxjs/toolkit/query";
import { enhancedApi } from "../app/enhancedApi";
import { api } from "../app/api";
import type { ApiTag, Document } from "../app/api";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { DocumentPreview } from "./DocumentPreview";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DocumentPreviewControls } from "../components/DocumentPreviewControls";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { twMerge } from "tailwind-merge";
import { DocumentDiashow } from "../components/DocumentDiashow";
import { preventInputHandling } from "../util/preventInputHandling";
import { TagList } from "../components/TagList";
import { TagInput } from "./TagInput";
import { tagToString } from "../util/tag";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AddDocumentToCollection } from "./AddDocumentToCollection";
import { DocumentAccessPanel } from "./DocumentAccessPanel";

type Tab = "info" | "tags" | "collections" | "access";

type Props = {
  previewImageId: string;
  previewImageIndex: number;
  queryParams: Omit<
    Parameters<typeof enhancedApi.useListDocumentsQuery>[0],
    SkipToken
  >;
  totalDocuments: number;
  onThumbnailClicked: (id: string) => void;
  nextPreviewImage: () => void;
  previousPreviewImage: () => void;
  onClose?: () => void;
};

export const PreviewContainer = ({
  previewImageId,
  previewImageIndex,
  totalDocuments,
  queryParams,
  onThumbnailClicked,
  nextPreviewImage,
  previousPreviewImage,
  onClose,
}: Props) => {
  const { data } = enhancedApi.useListDocumentsQuery({
    ...queryParams,
    limit: 5,
    offset: Math.min(
      Math.max(previewImageIndex - 2, 0),
      Math.max(totalDocuments - 5, 0),
    ),
  });

  const [diashowMode, setDiashowMode] = useState(false);
  const [wasFullscreen, setWasFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { data: identity } = api.useGetMeQuery();
  const currentDocument = data?.items.find((d) => d.id === previewImageId);
  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
  const canManageAccess =
    !!identity &&
    (identity.permissions.includes("admin:users") ||
      (identity.userId !== null &&
        identity.userId !== SYSTEM_USER_ID &&
        identity.userId === currentDocument?.ownerId));

  const mimeType = currentDocument?.mime;
  const documentDownloadUrl = useDocumentUrl(previewImageId);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (preventInputHandling()) return;
      if (event.key === "ArrowRight") nextPreviewImage();
      else if (event.key === "ArrowLeft") previousPreviewImage();
      else if (event.key === "Escape") onClose?.();
      else if (event.key === "p") setDiashowMode((m) => !m);
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [nextPreviewImage, previousPreviewImage, onClose]);

  useEffect(() => {
    if (diashowMode) {
      setWasFullscreen(!!document.fullscreenElement);
      document.body.requestFullscreen();
    } else if (!wasFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [diashowMode, wasFullscreen]);

  const onCloseImpl = useCallback(() => {
    if (diashowMode) setDiashowMode(false);
    else onClose?.();
  }, [onClose, diashowMode]);

  const tabs: Tab[] = ["info", "tags", "collections", ...(canManageAccess ? (["access"] as Tab[]) : [])];

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="flex-shrink-0 h-14 bg-surface-1 border-b border-border">
        <DocumentPreviewControls
          documentId={previewImageId}
          previewImageIndex={previewImageIndex}
          totalDocuments={totalDocuments}
          mimeType={mimeType}
          nextDocument={nextPreviewImage}
          previousDocument={previousPreviewImage}
          downloadDocument={() => {
            const link = document.createElement("a");
            link.href = documentDownloadUrl;
            link.download = "";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          toggleDiashow={() => setDiashowMode((m) => !m)}
          onClose={onCloseImpl}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview */}
        <div className="flex-1 relative overflow-hidden bg-bg-base">
          {diashowMode ? (
            <DocumentDiashow
              documentId={previewImageId}
              nextDocument={nextPreviewImage}
              previousDocument={previousPreviewImage}
              mimeType={mimeType}
            />
          ) : (
            <DocumentPreview
              id={previewImageId}
              mimeType={mimeType}
              nextPreviewImage={nextPreviewImage}
              previousPreviewImage={previousPreviewImage}
            />
          )}
        </div>

        {/* Right panel */}
        {!diashowMode && (
          <div className="w-80 xl:w-96 flex-shrink-0 border-l border-border bg-surface-1 flex flex-col">
            <div className="flex border-b border-border flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={twMerge(
                    "flex-1 py-3 text-sm font-medium transition-colors capitalize",
                    activeTab === tab
                      ? "border-b-2 border-accent text-text-primary"
                      : "text-text-muted hover:text-text-primary",
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === "info" && <InfoProperties document={currentDocument} />}
              {activeTab === "tags" && <DocumentTagsPanel documentId={previewImageId} />}
              {activeTab === "collections" && (
                <div className="flex-1 overflow-y-auto p-3">
                  <AddDocumentToCollection documentId={previewImageId} />
                </div>
              )}
              {activeTab === "access" && (
                <div className="flex-1 overflow-y-auto">
                  <DocumentAccessPanel documentId={previewImageId} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex-shrink-0 h-28 border-t border-border bg-surface-1 p-2 overflow-hidden flex items-center justify-center">
        <ThumbnailContainer
          alignment="center"
          thumbnails={data?.items || []}
          onClick={onThumbnailClicked}
          wrap="nowrap"
          highlighted={new Set([previewImageId])}
          size="small"
        />
      </div>
    </div>
  );
};

const InfoProperties = ({ document }: { document?: Document }) => {
  const properties: { label: string; value: string }[] = [
    { label: "Type", value: document?.mime ?? "—" },
    { label: "Dimensions", value: "—" },
    { label: "Size", value: "—" },
    { label: "Uploaded", value: "—" },
    { label: "Owner", value: "—" },
    { label: "Hash", value: "—" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
        Properties
      </h3>
      <div className="flex flex-col gap-3">
        {properties.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="text-text-muted flex-shrink-0">{label}</span>
            <span className="text-text-primary font-mono text-xs text-right break-all">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DocumentTagsPanel = ({ documentId }: { documentId: string }) => {
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
