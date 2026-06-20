import type { Document } from "../app/api";
import { DocumentInfoPluginSections } from "./DocumentInfoPluginSections";

export const InfoProperties = ({ document }: { document?: Document }) => {
  const properties: { label: string; value: string }[] = [
    { label: "Type", value: document?.mime ?? "—" },
    { label: "Name", value: document?.friendlyName ?? "—" },
    {
      label: "Visibility",
      value: document ? (document.isPublic ? "Public" : "Private") : "—",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
          Properties
        </h3>
        <div className="flex flex-col gap-3">
          {properties.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-text-muted flex-shrink-0">{label}</span>
              <span className="text-text-primary font-mono text-xs text-right break-all">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      {document && <DocumentInfoPluginSections document={document} />}
    </div>
  );
};
