import { fileIconFromMimeType } from "../util/fileIconFromFile";

type Props = {
  mimeType: string;
  fileName: string;
};

export const FileTypeBadge = ({ mimeType, fileName }: Props) => {
  const IconComponent = fileIconFromMimeType(mimeType);
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <div className="relative w-12 h-12 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
      <IconComponent className="w-6 h-6 text-text-secondary" />
      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-text-faint leading-none">
        {ext.slice(0, 4)}
      </span>
    </div>
  );
};
