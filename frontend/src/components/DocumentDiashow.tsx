import React from "react";
import { useDocument } from "../hooks/useDocument";
import { useDocumentPlugin } from "../hooks/useDocumentPlugin";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { useSwipeable } from "react-swipeable";

type Props = {
  documentId: string;
  nextDocument: () => void;
  previousDocument: () => void;
  defaultTimeout?: number;
  mimeType?: string;
};

export const DocumentDiashow = ({
  documentId,
  nextDocument,
  previousDocument,
  defaultTimeout = 3000,
  mimeType,
}: Props) => {
  const pluginFromProp = useDocumentPlugin(mimeType);
  const isStream = pluginFromProp.fetchMode === "stream";

  const { objectUrl: blobUrl, blob } = useDocument(documentId, isStream);
  const streamUrl = useDocumentUrl(documentId);

  const effectiveMimeType = mimeType ?? blob?.type;
  const plugin = useDocumentPlugin(effectiveMimeType);

  const objectUrl = isStream ? streamUrl : blobUrl;

  const handlers = useSwipeable({
    onSwipedLeft: () => nextDocument(),
    onSwipedRight: () => previousDocument(),
    trackMouse: true,
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  if (!objectUrl) {
    return null;
  }

  return (
    <div
      className="fixed z-10 bg-surface-1 w-screen h-screen left-0 top-0"
      {...handlers}
    >
      <plugin.Diashow
        objectUrl={objectUrl}
        defaultTimeout={defaultTimeout}
        nextDocument={nextDocument}
        React={React}
      />
    </div>
  );
};
