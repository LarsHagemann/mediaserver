import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdAdd,
  MdCheck,
  MdDeleteOutline,
  MdLock,
  MdPublic,
} from "react-icons/md";
import { api, type ApiTag } from "../app/api";
import { Button } from "../components/Button";
import { stringToTag, tagToString } from "../util/tag";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";
import { useUploadContext } from "../upload/UploadContext";
import { BatchTagsControl } from "../upload/BatchTagsControl";
import { UploadDropZone } from "../upload/UploadDropZone";
import { UploadQueueRow } from "../upload/UploadQueueRow";
import {
  VisibilitySelector,
  type Visibility,
} from "../upload/VisibilitySelector";
import { useAppDispatch, useAppSelector } from "../app/store";
import {
  selectMaxConcurrentUploads,
  setMaxConcurrentUploads,
} from "../app/persistent.slice";

type QueuedFile = {
  id: string;
  file: File;
  extraTags: ApiTag[];
  friendlyName: string;
};

export const UploadPage = () => {
  const { t } = useTranslation();
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [batchTags, setBatchTags] = useState<ApiTag[]>([]);
  const [tagInputValue, setTagInputValue] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileStoreRef = useRef<Map<string, File>>(new Map());

  const {
    markFileAsToBeUploaded,
    toBeUploaded,
    toBeProcessed,
    processedFiles,
    failedFiles,
    progress,
  } = useUploadContext();

  const dispatch = useAppDispatch();
  const maxConcurrentUploads = useAppSelector(selectMaxConcurrentUploads);
  const { data: config } = api.useGetAppConfigQuery();

  const addFiles = useCallback((files: File[]) => {
    const newItems: QueuedFile[] = files.map((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      fileStoreRef.current.set(id, file);
      return { id, file, extraTags: [], friendlyName: file.name };
    });
    setQueuedFiles((prev) => [...prev, ...newItems]);
  }, []);

  const removeQueued = useCallback((id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
    fileStoreRef.current.delete(id);
  }, []);

  const handleUpload = useCallback(() => {
    queuedFiles.forEach((qf) => {
      markFileAsToBeUploaded(
        qf.file,
        [...batchTags, ...qf.extraTags],
        visibility === "public",
        qf.friendlyName,
      );
    });
    setQueuedFiles([]);
  }, [queuedFiles, batchTags, visibility, markFileAsToBeUploaded]);

  const retryFailed = useCallback(
    (fileName: string) => {
      for (const [, file] of fileStoreRef.current) {
        if (file.name === fileName) {
          markFileAsToBeUploaded(
            file,
            batchTags,
            visibility === "public",
            file.name,
          );
          return;
        }
      }
    },
    [batchTags, visibility, markFileAsToBeUploaded],
  );

  const totalQueuedSize = queuedFiles.reduce((acc, f) => acc + f.file.size, 0);
  const totalFiles =
    queuedFiles.length +
    toBeUploaded.size +
    toBeProcessed.size +
    processedFiles.size +
    failedFiles.size;

  return (
    <div
      className="flex flex-col h-full p-6 gap-5 overflow-y-auto"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-row items-start justify-between gap-6 w-full">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("pages.upload.title")}</h1>
          </div>
          {totalFiles > 0 && (
            <div className="flex flex-row gap-6 text-right shrink-0">
              <div>
                <div className="text-2xl font-bold">{queuedFiles.length}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
                  {t("pages.upload.statQueued")}
                </div>
              </div>
              {totalQueuedSize > 0 && (
                <div>
                  <div className="text-2xl font-bold">
                    {bytesToHumanReadable(totalQueuedSize)}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
                    {t("pages.upload.statTotalSize")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-text-secondary mt-1 max-w-xl">
            {t("pages.upload.headerDescriptionPre")}{" "}
            <strong className="text-text-primary">
              {t("pages.upload.everythingInBatch")}
            </strong>
            {t("pages.upload.headerDescriptionPost")}
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          config?.idpEnabled ? "md:grid-cols-2" : ""
        }`}
      >
        <BatchTagsControl
          tags={batchTags}
          inputValue={tagInputValue}
          onInputChange={setTagInputValue}
          onAdd={(tag) => setBatchTags((prev) => [...prev, stringToTag(tag)])}
          onRemove={(tag) =>
            setBatchTags((prev) =>
              prev.filter((t) => tagToString(t) !== tagToString(tag)),
            )
          }
        />
        {config?.idpEnabled && (
          <VisibilitySelector value={visibility} onChange={setVisibility} />
        )}
      </div>

      <UploadDropZone
        isDragging={isDragging}
        hasFiles={totalFiles > 0}
        onChooseFiles={() => fileInputRef.current?.click()}
      />

      {/* Upload Queue */}
      {totalFiles > 0 && (
        <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {t("pages.upload.queueTitle")}
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-2 text-xs font-mono text-accent-subtle">
                {t("pages.upload.fileCount", { count: totalFiles })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-text-muted">
                {t("pages.upload.parallelUploads")}
                <select
                  value={maxConcurrentUploads}
                  onChange={(e) =>
                    dispatch(setMaxConcurrentUploads(Number(e.target.value)))
                  }
                  className="bg-surface-2 border border-border rounded px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus:border-border-strong"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="ghost"
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <MdAdd size={15} /> {t("pages.upload.addMore")}
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-1 text-sm hover:text-danger-subtle"
                onClick={() => setQueuedFiles([])}
              >
                <MdDeleteOutline size={15} /> {t("pages.upload.clearAll")}
              </Button>
            </div>
          </div>
          <div className="divide-y divide-border overflow-y-auto h-[calc(100%-3rem)]">
            {queuedFiles.map((qf) => (
              <UploadQueueRow
                key={qf.id}
                fileName={qf.file.name}
                fileSize={qf.file.size}
                mimeType={qf.file.type}
                status="queued"
                batchTags={batchTags}
                extraTags={qf.extraTags}
                friendlyName={qf.friendlyName}
                onFriendlyNameChange={(name) =>
                  setQueuedFiles((prev) =>
                    prev.map((f) =>
                      f.id === qf.id ? { ...f, friendlyName: name } : f,
                    ),
                  )
                }
                onRemove={() => removeQueued(qf.id)}
                onAddTag={(tag) =>
                  setQueuedFiles((prev) =>
                    prev.map((f) =>
                      f.id === qf.id
                        ? {
                            ...f,
                            extraTags: [...f.extraTags, stringToTag(tag)],
                          }
                        : f,
                    ),
                  )
                }
                onRemoveExtraTag={(tag) =>
                  setQueuedFiles((prev) =>
                    prev.map((f) =>
                      f.id === qf.id
                        ? {
                            ...f,
                            extraTags: f.extraTags.filter(
                              (t) => tagToString(t) !== tagToString(tag),
                            ),
                          }
                        : f,
                    ),
                  )
                }
              />
            ))}
            {Array.from(toBeUploaded).map((fw) => (
              <UploadQueueRow
                key={`pending-${fw.file.name}`}
                fileName={fw.file.name}
                fileSize={fw.file.size}
                mimeType={fw.file.type}
                status="uploading"
                batchTags={batchTags}
                extraTags={[]}
              />
            ))}
            {Array.from(toBeProcessed).map((fp) => (
              <UploadQueueRow
                key={`processing-${fp.name}`}
                fileName={fp.name}
                mimeType={fp.type}
                status="uploading"
                uploadProgress={progress.get(fp.name)}
                batchTags={batchTags}
                extraTags={[]}
              />
            ))}
            {Array.from(processedFiles).map((fp) => (
              <UploadQueueRow
                key={`done-${fp.name}`}
                fileName={fp.name}
                mimeType={fp.type}
                status="done"
                batchTags={batchTags}
                extraTags={[]}
              />
            ))}
            {Array.from(failedFiles).map((fp) => (
              <UploadQueueRow
                key={`failed-${fp.name}`}
                fileName={fp.name}
                mimeType={fp.type}
                status="failed"
                errorReason={fp.errorReason}
                batchTags={batchTags}
                extraTags={[]}
                onRetry={() => retryFailed(fp.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer bar */}
      {totalFiles > 0 && (
        <div className="sticky bottom-0 bg-surface-1 border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-text-secondary flex-wrap">
            <span>
              <strong className="text-text-primary">
                {t("pages.upload.fileCount", { count: totalFiles })}
              </strong>
              {totalQueuedSize > 0 && (
                <> · {bytesToHumanReadable(totalQueuedSize)}</>
              )}
            </span>
            {config?.idpEnabled && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-border text-xs">
                {visibility === "private" ? (
                  <MdLock size={11} />
                ) : (
                  <MdPublic size={11} />
                )}
                {visibility === "private"
                  ? t("pages.upload.private")
                  : t("pages.upload.public")}
              </span>
            )}
            {batchTags.length > 0 && (
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                {t("pages.upload.batchTagCount", { count: batchTags.length })}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            disabled={queuedFiles.length === 0}
            className="flex items-center gap-2 text-sm font-medium"
            onClick={handleUpload}
          >
            <MdCheck size={16} />{" "}
            {t("pages.upload.uploadButton", { count: queuedFiles.length })}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            addFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />
    </div>
  );
};
