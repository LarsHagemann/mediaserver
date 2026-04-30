import type { SkipToken } from "@reduxjs/toolkit/query";
import { enhancedApi } from "../app/enhancedApi";
import { ThumbnailContainer } from "../components/ThumbnailContainer";
import { DocumentPreview } from "./DocumentPreview";
import { useEffect, useState } from "react";
import { DocumentPreviewControls } from "../components/DocumentPreviewControls";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { twMerge } from "tailwind-merge";
import { MdClose } from "react-icons/md";

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

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
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

  return (
    <>
      <MdClose
        className="absolute top-4 right-4 z-100 text-3xl cursor-pointer hover:rotate-180 duration-200 hover:text-red-400"
        onClick={onClose}
      />
      <div
        className={twMerge(
          "absolute top-0 w-full h-[calc(100%-60px-2rem)] sm:h-[calc(100%-120px-2rem)] bg-gray-900 bg-opacity-75 flex items-center justify-center overflow-visible",
          diashowMode ? "z-50" : "z-30",
        )}
      >
        <DocumentPreview
          id={previewImageId}
          diashow={diashowMode}
          nextDocument={nextPreviewImage}
          mimeType={mimeType}
        />
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
        />
      </div>
      <div className="absolute flex flex-row flex-wrap bottom-0 right-0 w-full h-[calc(60px+2rem)] sm:h-[calc(120px+2rem)] z-30 p-2 bg-gray-800 overflow-y-hidden justify-center">
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
    </>
  );
};
