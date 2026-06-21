import type { SkipToken } from "@reduxjs/toolkit/query";
import { enhancedApi } from "../app/enhancedApi";
import { api, type Document } from "../app/api";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { DocumentPreview } from "./DocumentPreview";
import { useCallback, useEffect, useState } from "react";
import { DocumentPreviewControls } from "../components/DocumentPreviewControls";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { DocumentDiashow } from "../components/DocumentDiashow";
import { preventInputHandling } from "../util/preventInputHandling";
import { DocumentInfoPanel } from "./DocumentInfoPanel";

type Props = {
  previewImageId: string;
  previewImageIndex: number;
  queryParams: Omit<
    Parameters<typeof enhancedApi.useListDocumentsQuery>[0],
    SkipToken
  >;
  totalDocuments: number;
  onThumbnailClicked: (document: Document) => void;
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
  const { data } = enhancedApi.useListDocumentsQuery(
    {
      ...queryParams,
      limit: 5,
      offset: Math.min(
        Math.max(previewImageIndex - 2, 0),
        Math.max(totalDocuments - 5, 0),
      ),
    },
    { refetchOnFocus: true, refetchOnReconnect: true },
  );

  const [diashowMode, setDiashowMode] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [wasFullscreen, setWasFullscreen] = useState(false);

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

  const onCloseImpl = useCallback(() => {
    if (diashowMode) setDiashowMode(false);
    else onClose?.();
  }, [onClose, diashowMode]);

  const onThumbnailClick = useCallback(
    (id: string) => {
      const clicked = data?.items.find((d) => d.id === id);
      if (clicked) onThumbnailClicked(clicked);
    },
    [data, onThumbnailClicked],
  );

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (preventInputHandling()) return;
      if (event.key === "ArrowRight") nextPreviewImage();
      else if (event.key === "ArrowLeft") previousPreviewImage();
      else if (event.key === "Escape") onCloseImpl();
      else if (event.key === "p") setDiashowMode((m) => !m);
      else if (event.key === "i") setShowInfoPanel((m) => !m);
    };
    window.addEventListener("keydown", keyDownHandler);
    return () => window.removeEventListener("keydown", keyDownHandler);
  }, [nextPreviewImage, previousPreviewImage, onCloseImpl]);

  useEffect(() => {
    if (diashowMode) {
      setWasFullscreen(!!document.fullscreenElement);
      document.body.requestFullscreen();
    } else if (!wasFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [diashowMode, wasFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && diashowMode) {
        setDiashowMode(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [diashowMode]);

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header */}
      <div className="flex-shrink-0 h-14 bg-surface-1 border-b border-border">
        <DocumentPreviewControls
          documentId={previewImageId}
          friendlyName={currentDocument?.friendlyName}
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
          toggleInfoPanel={() => setShowInfoPanel((m) => !m)}
          showInfoPanel={showInfoPanel}
          onClose={onCloseImpl}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Preview */}
        <div className="flex-1 relative overflow-hidden bg-bg-base">
          {diashowMode ? (
            <DocumentDiashow
              documentId={previewImageId}
              nextDocument={nextPreviewImage}
              previousDocument={previousPreviewImage}
              mimeType={mimeType}
              toggleInfoPanel={() => setShowInfoPanel((m) => !m)}
              showInfoPanel={showInfoPanel}
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

        {/* Mobile backdrop — tapping the image area closes the info panel */}
        {showInfoPanel && (
          <div
            className="md:hidden absolute inset-0 z-[9]"
            onClick={() => setShowInfoPanel(false)}
          />
        )}

        {/* Info panel — on mobile: absolute overlay; on desktop: flex sibling with width animation */}
        <div
          className={
            "overflow-hidden transition-[width] duration-300 ease-in-out " +
            "absolute top-0 right-0 h-full z-10 " +
            "md:relative md:flex-shrink-0 md:z-auto " +
            (showInfoPanel ? "w-80 xl:w-96" : "w-0")
          }
        >
          <DocumentInfoPanel
            documentId={previewImageId}
            currentDocument={currentDocument}
            canManageAccess={canManageAccess}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      {!diashowMode && (
        <div className="flex-shrink-0 h-36 border-t border-border bg-surface-1 p-2 overflow-hidden flex items-center justify-center">
          <ThumbnailContainer
            alignment="center"
            thumbnails={data?.items || []}
            onClick={onThumbnailClick}
            wrap="nowrap"
            highlighted={new Set([previewImageId])}
            variant="thumbnail"
          />
        </div>
      )}
    </div>
  );
};
