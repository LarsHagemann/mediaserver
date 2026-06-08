import { DocumentRender } from "../components/DocumentRender";
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
  const handlers = useSwipeable({
    onSwipedLeft: nextPreviewImage,
    onSwipedRight: previousPreviewImage,
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div className="w-full h-full" {...handlers}>
      <DocumentRender documentId={id} mimeType={mimeType} />
    </div>
  );
};
