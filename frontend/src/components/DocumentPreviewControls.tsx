import type React from "react";
import { useState } from "react";
import { FaCaretLeft, FaCaretRight, FaDownload, FaFile } from "react-icons/fa";
import { LuPresentation } from "react-icons/lu";
import { MdClose, MdEdit, MdInfoOutline } from "react-icons/md";
import { updateDocumentFriendlyName } from "../app/api";
import { enhancedApi } from "../app/enhancedApi";
import { useAppDispatch } from "../app/store";

type Props = {
  documentId: string;
  friendlyName?: string;
  previewImageIndex: number;
  totalDocuments: number;
  mimeType?: string;
  nextDocument: () => void;
  previousDocument: () => void;
  downloadDocument: () => void;
  toggleDiashow: () => void;
  toggleInfoPanel: () => void;
  showInfoPanel: boolean;
  onClose: () => void;
};

export const DocumentPreviewControls: React.FC<Props> = ({
  documentId,
  friendlyName,
  previewImageIndex,
  totalDocuments,
  mimeType,
  nextDocument,
  previousDocument,
  downloadDocument,
  toggleDiashow,
  toggleInfoPanel,
  showInfoPanel,
  onClose,
}) => {
  const ext = mimeType?.split("/")[1];
  const displayName =
    friendlyName || (ext ? `document.${ext}` : documentId.slice(0, 8));
  const current = previewImageIndex + 1;
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);

  const commitRename = async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== displayName) {
      await updateDocumentFriendlyName(documentId, trimmed);
      dispatch(enhancedApi.util.invalidateTags(["document"]));
    } else {
      setNameValue(displayName);
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between px-4 h-full gap-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0 p-1.5 rounded bg-surface-2 text-text-muted">
          <FaFile size="0.875rem" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {editing ? (
              <input
                autoFocus
                className="text-sm font-semibold bg-surface-2 border border-border rounded px-1.5 py-0.5 outline-none focus:border-border-strong"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void commitRename();
                  if (e.key === "Escape") {
                    setNameValue(displayName);
                    setEditing(false);
                  }
                }}
              />
            ) : (
              <>
                <div className="text-sm font-semibold text-text-primary truncate">
                  {displayName}
                </div>
                <button
                  onClick={() => {
                    setNameValue(displayName);
                    setEditing(true);
                  }}
                  className="p-1 rounded hover:bg-surface-2 text-text-faint hover:text-text-muted transition-colors shrink-0"
                  title="Rename"
                >
                  <MdEdit size="0.75rem" />
                </button>
              </>
            )}
          </div>
          <div className="text-xs text-text-muted">
            {current} of {totalDocuments}
            {mimeType ? ` · ${mimeType}` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={previousDocument}
          className="p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <FaCaretLeft size="1.25rem" />
        </button>
        <span className="text-sm text-text-muted px-1 tabular-nums">
          {current} / {totalDocuments}
        </span>
        <button
          onClick={nextDocument}
          className="p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <FaCaretRight size="1.25rem" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={downloadDocument}
          title="Download"
          className="p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <FaDownload size="0.875rem" />
        </button>
        <button
          onClick={toggleDiashow}
          title="Slideshow"
          className="p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <LuPresentation size="1rem" />
        </button>
        <button
          onClick={toggleInfoPanel}
          title="Info"
          className={`md:hidden p-2 rounded-md hover:bg-surface-2 transition-colors ${showInfoPanel ? "text-accent-subtle" : "text-text-muted hover:text-text-primary"}`}
        >
          <MdInfoOutline size="1.25rem" />
        </button>
        <button
          onClick={onClose}
          title="Close"
          className="p-2 rounded-md hover:bg-surface-2 text-text-muted hover:text-danger-subtle transition-colors"
        >
          <MdClose size="1.25rem" />
        </button>
      </div>
    </div>
  );
};
