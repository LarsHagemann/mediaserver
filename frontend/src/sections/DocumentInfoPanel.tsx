import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AddDocumentToCollection } from "./AddDocumentToCollection";
import { DocumentAccessPanel } from "./DocumentAccessPanel";
import { DocumentTagsPanel } from "./DocumentTagsPanel";
import { InfoProperties } from "./InfoProperties";
import type { Document } from "../app/api";

type Tab = "info" | "tags" | "collections" | "access";

type Props = {
  documentId: string;
  currentDocument?: Document;
  canManageAccess: boolean;
  className?: string;
};

export const DocumentInfoPanel = ({
  documentId,
  currentDocument,
  canManageAccess,
  className,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const tabs: Tab[] = [
    "info",
    "tags",
    "collections",
    ...(canManageAccess ? (["access"] as Tab[]) : []),
  ];

  return (
    <div
      className={twMerge(
        "w-80 xl:w-96 flex-shrink-0 h-full border-l border-border bg-surface-1 flex flex-col",
        className,
      )}
    >
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={twMerge(
              "flex-1 py-3 text-sm font-medium transition-colors capitalize",
              activeTab === tab
                ? "border-b-2 border-accent text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "info" && <InfoProperties document={currentDocument} />}
        {activeTab === "tags" && <DocumentTagsPanel documentId={documentId} />}
        {activeTab === "collections" && (
          <div className="flex-1 overflow-y-auto p-3">
            <AddDocumentToCollection documentId={documentId} />
          </div>
        )}
        {activeTab === "access" && (
          <div className="flex-1 overflow-y-auto">
            <DocumentAccessPanel documentId={documentId} />
          </div>
        )}
      </div>
    </div>
  );
};
