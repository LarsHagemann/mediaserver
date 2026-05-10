import type React from "react";
import { FaCaretLeft, FaCaretRight, FaDownload, FaFile } from "react-icons/fa";
import { LuPresentation } from "react-icons/lu";
import { MdClose } from "react-icons/md";

type Props = {
  documentId: string;
  previewImageIndex: number;
  totalDocuments: number;
  mimeType?: string;
  nextDocument: () => void;
  previousDocument: () => void;
  downloadDocument: () => void;
  toggleDiashow: () => void;
  onClose: () => void;
};

export const DocumentPreviewControls: React.FC<Props> = ({
  documentId,
  previewImageIndex,
  totalDocuments,
  mimeType,
  nextDocument,
  previousDocument,
  downloadDocument,
  toggleDiashow,
  onClose,
}) => {
  const ext = mimeType?.split("/")[1];
  const displayName = ext ? `document.${ext}` : documentId.slice(0, 8);
  const current = previewImageIndex + 1;

  return (
    <div className="flex items-center justify-between px-4 h-full gap-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0 p-1.5 rounded bg-surface-2 text-text-muted">
          <FaFile size="0.875rem" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary truncate">
            {displayName}
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
