import React from "react";
import { useDocument } from "../hooks/useDocument";
import { useDocumentPlugin } from "../hooks/useDocumentPlugin";
import { useDocumentUrl } from "../hooks/useDocumentUrl";

type Props = {
  documentId: string;
  mimeType?: string;
};

export const DocumentRender = ({ documentId, mimeType }: Props) => {
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

  return <plugin.Render objectUrl={objectUrl} React={React} />;
};
