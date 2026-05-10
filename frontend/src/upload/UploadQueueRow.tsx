import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BiErrorAlt } from "react-icons/bi";
import { MdAdd, MdCheck, MdClose, MdRefresh } from "react-icons/md";
import type { ApiTag } from "../app/api";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { TagInput } from "../sections/TagInput";
import { tagToString } from "../util/tag";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";
import { FileTypeBadge } from "./FileTypeBadge";

export type UploadStatus = "queued" | "uploading" | "done" | "failed";

type Props = {
  fileName: string;
  fileSize?: number;
  mimeType: string;
  status: UploadStatus;
  errorReason?: string;
  uploadProgress?: number;
  batchTags: ApiTag[];
  extraTags: ApiTag[];
  onRemove?: () => void;
  onRetry?: () => void;
  onAddTag?: (tag: string) => void;
  onRemoveExtraTag?: (tag: ApiTag) => void;
};

export const UploadQueueRow = ({
  fileName,
  fileSize,
  mimeType,
  status,
  errorReason,
  uploadProgress,
  batchTags,
  extraTags,
  onRemove,
  onRetry,
  onAddTag,
  onRemoveExtraTag,
}: Props) => {
  const { t } = useTranslation();
  const [addingTag, setAddingTag] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const allTags = [...batchTags, ...extraTags];

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <FileTypeBadge mimeType={mimeType} fileName={fileName} />

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{fileName}</span>
        {fileSize !== undefined && (
          <span className="text-xs text-text-muted">
            {bytesToHumanReadable(fileSize)}
          </span>
        )}
        <div className="flex flex-wrap gap-1 items-center">
          {allTags.map((tag) => {
            const label = tagToString(tag);
            const isExtra = extraTags.some((t) => tagToString(t) === label);
            return (
              <Badge
                key={label}
                onDelete={
                  isExtra && onRemoveExtraTag
                    ? () => onRemoveExtraTag(tag)
                    : undefined
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-subtle shrink-0" />
                {label}
              </Badge>
            );
          })}
          {onAddTag &&
            (addingTag ? (
              <TagInput
                clearOnSubmit
                value={tagValue}
                onChange={setTagValue}
                onSubmit={(tag) => {
                  if (tag.trim()) onAddTag(tag);
                  setTagValue("");
                  setAddingTag(false);
                }}
                placeholder={t("pages.upload.addTag")}
                className="w-28"
              />
            ) : (
              <Button
                variant="ghost"
                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-border text-xs hover:border-border-strong hover:text-text-secondary"
                onClick={() => setAddingTag(true)}
              >
                <MdAdd size={11} /> {t("pages.upload.addTag")}
              </Button>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {status === "queued" && (
          <span className="text-xs font-semibold tracking-wider text-text-faint uppercase">
            {t("pages.upload.statusQueued")}
          </span>
        )}
        {status === "uploading" && (
          <div className="flex flex-col items-end gap-1 w-24">
            {uploadProgress !== undefined ? (
              <>
                <div className="w-full bg-surface-2 rounded-full h-1.5">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">
                  {Math.round(uploadProgress)}%
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-accent-subtle animate-pulse">
                {t("pages.upload.statusUploading")}
              </span>
            )}
          </div>
        )}
        {status === "done" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-success-strong">
            <MdCheck size={14} /> {t("pages.upload.statusDone")}
          </span>
        )}
        {status === "failed" && (
          <span
            className="flex items-center gap-1 text-xs font-semibold text-danger-strong"
            title={errorReason}
          >
            <BiErrorAlt size={14} />
            {onRetry && (
              <Button
                variant="ghost"
                className="flex items-center gap-0.5 ml-1 text-xs hover:text-text-primary"
                onClick={onRetry}
                title={t("pages.upload.statusRetry")}
              >
                <MdRefresh size={14} /> {t("pages.upload.statusRetry")}
              </Button>
            )}
          </span>
        )}
        {onRemove && (
          <IconButton
            onClick={onRemove}
            className="text-text-faint hover:text-text-primary"
          >
            <MdClose size={16} />
          </IconButton>
        )}
      </div>
    </div>
  );
};
