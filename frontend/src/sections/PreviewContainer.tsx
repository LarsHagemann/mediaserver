import type { SkipToken } from "@reduxjs/toolkit/query";
import { enhancedApi } from "../app/enhancedApi";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { DocumentPreview } from "./DocumentPreview";
import { useCallback, useEffect, useState } from "react";
import { DocumentPreviewControls } from "../components/DocumentPreviewControls";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { twMerge } from "tailwind-merge";
import { DocumentDiashow } from "../components/DocumentDiashow";
import { preventInputHandling } from "../util/preventInputHandling";
import { AddToCollectionModal } from "./AddToCollectionModal";

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

  // Todo: Show "AddToCollectionModal" here
  const onBookmark = () => {
    setAddToCollectionModalOpen(true);
  };

  const onCloseImpl = useCallback(() => {
    if (diashowMode) {
      setDiashowMode(false);
    }
    else { onClose?.(); }
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
              onBookmark={onBookmark}
            />
          </div>
          <div className="flex flex-1 w-full">
            {diashowMode && (
              <div className="fixed z-10 bg-surface-1 w-screen h-screen left-0 top-0">
                <DocumentDiashow documentId={previewImageId} nextDocument={nextPreviewImage} mimeType={mimeType} />
              </div>
            )}
            {!diashowMode && (
              <DocumentPreview
                id={previewImageId}
                mimeType={mimeType}
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
          selected={previewImageId}
          size="small"
        />
      </div>
      <AddToCollectionModal
        documentId={previewImageId}
        isOpen={addToCollectionModalOpen}
        onClose={() => setAddToCollectionModalOpen(false)}
      />
    </>
  );
};
