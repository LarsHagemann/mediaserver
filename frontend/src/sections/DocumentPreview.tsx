import { useCallback, useRef, useState } from "react";
import { DocumentRender } from "../components/DocumentRender";
import { IndeterminateProgressBar } from "../components/IndeterminateProgressBar";
import { useSwipeable } from "react-swipeable";

type Props = {
  id: string;
  mimeType?: string;
  nextPreviewImage: () => void;
  previousPreviewImage: () => void;
};

export const DocumentPreview = ({
  id,
  mimeType,
  nextPreviewImage,
  previousPreviewImage,
}: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const loadingIdRef = useRef(id);

  const handleLoadingChange = useCallback(
    (loading: boolean, documentId: string) => {
      if (documentId === loadingIdRef.current) {
        setIsLoading(loading);
      }
    },
    [],
  );

  if (id !== loadingIdRef.current) {
    loadingIdRef.current = id;
    setIsLoading(true);
  }

  const handlers = useSwipeable({
    onSwipedLeft: nextPreviewImage,
    onSwipedRight: previousPreviewImage,
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div className="w-full h-full relative" {...handlers}>
      <IndeterminateProgressBar
        isLoading={isLoading}
        className="absolute top-0 left-0 right-0 z-10"
      />
      <div className={isLoading ? "w-full h-full invisible" : "w-full h-full"}>
        <DocumentRender
          documentId={id}
          mimeType={mimeType}
          onLoadingChange={handleLoadingChange}
        />
      </div>
    </div>
  );
};
