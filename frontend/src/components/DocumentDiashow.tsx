import React from "react";
import { useDocument } from "../hooks/useDocument";
import { useDocumentPlugin } from "../hooks/useDocumentPlugin";
import { useDocumentUrl } from "../hooks/useDocumentUrl";

type Props = {
  documentId: string;
  nextDocument: () => void;
  defaultTimeout?: number;
  mimeType?: string;
};

export const DocumentDiashow = ({
  documentId,
  nextDocument,
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

  if (!objectUrl) {
    return null;
  }

  return (
    <plugin.Diashow
      objectUrl={objectUrl}
      defaultTimeout={defaultTimeout}
      nextDocument={nextDocument}
      React={React}
    />
  );
};
