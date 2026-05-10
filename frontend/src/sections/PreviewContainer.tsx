import type { SkipToken } from "@reduxjs/toolkit/query";
import { enhancedApi } from "../app/enhancedApi";
import { api } from "../app/api";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { DocumentPreview } from "./DocumentPreview";
import { useCallback, useEffect, useState } from "react";
import { DocumentPreviewControls } from "../components/DocumentPreviewControls";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { twMerge } from "tailwind-merge";
import { DocumentDiashow } from "../components/DocumentDiashow";
import { preventInputHandling } from "../util/preventInputHandling";

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

  const [diashowMode, setDiashowMode] = useState<boolean>(false);
  const [wasFullscreen, setWasFullscreen] = useState<boolean>(false);
  const [addToCollectionModalOpen, setAddToCollectionModalOpen] = useState(false);
  const [tagListOpen, setTagListOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  const { data: identity } = api.useGetMeQuery();
  const currentDocument = data?.items.find((d) => d.id === previewImageId);
  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
  const canManageAccess = !!identity && (
    identity.permissions.includes("admin:users") ||
    (identity.userId !== null && identity.userId !== SYSTEM_USER_ID && identity.userId === currentDocument?.ownerId)
  );

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (preventInputHandling()) {
        return;
      }

      if (event.key === "ArrowRight") {
        nextPreviewImage();
      } else if (event.key === "ArrowLeft") {
        previousPreviewImage();
      } else if (event.key === "Escape") {
        onClose?.();
      } else if (event.key === "p") {
        setDiashowMode((mode) => !mode);
      } else if (event.key === "c") {
        setAddToCollectionModalOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", keyDownHandler);
    return () => {
      window.removeEventListener("keydown", keyDownHandler);
    };
  }, [nextPreviewImage, previousPreviewImage, onClose]);

  useEffect(() => {
    if (diashowMode) {
      setWasFullscreen(!!document.fullscreenElement);
      document.body.requestFullscreen();
    } else {
      if (!wasFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [diashowMode, wasFullscreen]);

  const documentDownloadUrl = useDocumentUrl(previewImageId);
  const mimeType = data?.items.find((d) => d.id === previewImageId)?.mime;

  const onCloseImpl = useCallback(() => {
    if (diashowMode) {
      setDiashowMode(false);
    } else {
      onClose?.();
    }
  }, [onClose, diashowMode]);

  return (
    <>
      <div
        className={twMerge(
          "absolute top-0 w-full h-[calc(100%-60px-2rem)] sm:h-[calc(100%-120px-2rem)] bg-bg-base/75 flex items-center justify-center overflow-visible",
          diashowMode ? "z-50" : "z-30",
        )}
      >
        <div className="flex flex-col items-center justify-center top-0 left-0 w-full h-full">
          <div className="flex basis-8 w-full bg-surface-1">
            <DocumentPreviewControls
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
              toggleDiashow={() => setDiashowMode(!diashowMode)}
              onClose={onCloseImpl}
              bookmarksOpen={addToCollectionModalOpen}
              setBookmarksOpen={(open) => {
                setAddToCollectionModalOpen(open);
                if (open) setAccessOpen(false);
              }}
              tagListOpen={tagListOpen}
              setTagListOpen={setTagListOpen}
              accessOpen={accessOpen}
              setAccessOpen={(open) => {
                setAccessOpen(open);
                if (open) setAddToCollectionModalOpen(false);
              }}
              canManageAccess={canManageAccess}
            />
          </div>
          <div className="flex flex-1 w-full">
            {diashowMode && (
              <DocumentDiashow
                documentId={previewImageId}
                nextDocument={nextPreviewImage}
                previousDocument={previousPreviewImage}
                mimeType={mimeType}
              />
            )}
            {!diashowMode && (
              <DocumentPreview
                id={previewImageId}
                mimeType={mimeType}
                nextPreviewImage={nextPreviewImage}
                previousPreviewImage={previousPreviewImage}
                tagListOpen={tagListOpen}
                setTagListOpen={setTagListOpen}
                bookmarksOpen={addToCollectionModalOpen}
                setBookmarksOpen={setAddToCollectionModalOpen}
                accessOpen={accessOpen}
                setAccessOpen={setAccessOpen}
              />
            )}
          </div>
        </div>
      </div>
      <div className="absolute flex flex-row flex-wrap bottom-0 right-0 w-full h-[calc(60px+2rem)] sm:h-[calc(120px+2rem)] z-30 p-2 bg-surface-1 overflow-y-hidden justify-center">
        <ThumbnailContainer
          alignment="center"
          thumbnails={data?.items || []}
          onClick={(id) => {
            onThumbnailClicked(id);
          }}
          wrap="nowrap"
          highlighted={new Set([previewImageId])}
          size="small"
        />
      </div>
    </>
  );
};
