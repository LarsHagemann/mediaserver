import React, { useMemo } from "react";
import type { Document } from "../app/api";
import { PluginErrorBoundary } from "../components/PluginErrorBoundary";
import { enhancedApi } from "../app/enhancedApi";
import { pluginApi } from "../plugins/pluginApi";
import { pluginComponents } from "../plugins/pluginComponents";
import { pluginRegistry } from "../plugins/pluginRegistry";
import type { DocumentInfo } from "../plugins/plugin";

/**
 * Renders the document info sections contributed by plugins whose matcher
 * applies to the given document's MIME type. Each section gets the plugin
 * render context ({ React, api, document }) and is isolated behind an error
 * boundary.
 */
export const DocumentInfoPluginSections = ({
  document,
}: {
  document: Document;
}) => {
  const contributions = useMemo(
    () => pluginRegistry.getDocumentInfo(document.mime),
    [document.mime],
  );

  if (contributions.length === 0) {
    return null;
  }

  const documentInfo: DocumentInfo = {
    id: document.id,
    mime: document.mime,
    friendlyName: document.friendlyName,
    ownerId: document.ownerId,
    isPublic: document.isPublic,
  };

  return (
    <>
      {contributions.map(({ pluginId, pluginName, documentInfo: plugin }) => {
        const Render = plugin.Render;
        return (
          <PluginErrorBoundary key={pluginId} pluginName={pluginName}>
            <Render
              React={React}
              api={pluginApi}
              document={documentInfo}
              components={pluginComponents}
              dataApi={enhancedApi}
            />
          </PluginErrorBoundary>
        );
      })}
    </>
  );
};
