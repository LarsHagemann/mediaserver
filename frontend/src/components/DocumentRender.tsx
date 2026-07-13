import React from "react";
import { useDocument } from "../hooks/useDocument";
import { useDocumentPlugin } from "../hooks/useDocumentPlugin";
import { useDocumentUrl } from "../hooks/useDocumentUrl";
import { pluginComponents } from "../plugins/pluginComponents";
import { enhancedApi } from "../app/enhancedApi";

type Props = {
  documentId: string;
  mimeType?: string;
  onLoadingChange?: (isLoading: boolean, documentId: string) => void;
};

export const DocumentRender = ({
  documentId,
  mimeType,
  onLoadingChange,
}: Props) => {
  const pluginFromProp = useDocumentPlugin(mimeType);
  const isStream = pluginFromProp.fetchMode === "stream";

  const {
    objectUrl: blobUrl,
    blob,
    isLoading,
  } = useDocument(documentId, isStream);
  const streamUrl = useDocumentUrl(documentId);

  const effectiveMimeType = mimeType ?? blob?.type;
  const plugin = useDocumentPlugin(effectiveMimeType);

  const objectUrl = isStream ? streamUrl : blobUrl;

  React.useEffect(() => {
    onLoadingChange?.(isLoading, documentId);
  }, [isLoading, documentId, onLoadingChange]);

  if (!objectUrl) {
    return null;
  }

  return (
    <plugin.Render
      objectUrl={objectUrl}
      React={React}
      components={pluginComponents}
      dataApi={enhancedApi}
    />
  );
};
