import { useEffect, useState } from "react";
import { useDocument } from "../hooks/useDocument";
import { useDocumentPlugin } from "../hooks/useDocumentPlugin";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { useSwipeable } from "react-swipeable";
import { DocumentDiashowControls } from "./DocumentDiashowControls";
import React from "react";

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

  const [timeout, setTimeoutValue] = useState(defaultTimeout);
  const [paused, setPaused] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

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

  useEffect(() => {
    setAutoAdvance(!paused);
  }, [paused, documentId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (autoAdvance) {
        nextDocument();
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [timeout, nextDocument, autoAdvance]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-surface-1" {...handlers}>
      <DocumentDiashowControls
        nextDocument={nextDocument}
        previousDocument={previousDocument}
        togglePause={() => setPaused(!paused)}
        setTimeoutValue={setTimeoutValue}
        timeout={timeout}
        paused={paused}
      />
      <plugin.Diashow
        objectUrl={objectUrl}
        nextDocument={nextDocument}
        preventAutoAdvance={() => setAutoAdvance(false)}
        React={React}
      />
    </div>
  );
};
