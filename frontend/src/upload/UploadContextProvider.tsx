import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadContext,
  type FileProxy,
  type FileWithTags,
} from "./UploadContext";
import { useSet } from "../hooks/useSet";
import {
  useWebSocketContext,
  type WebSocketIncomingMessageSchema,
} from "../websocket/WebSocketContext";
import { uploadDocumentWithProgress, type ApiTag } from "../app/api";
import { useAppSelector } from "../app/store";
import { selectMaxConcurrentUploads } from "../app/persistent.slice";
import { enhancedApi } from "../app/enhancedApi";

export const UploadContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    set: toBeUploaded,
    add: addToBeUploaded,
    remove: removeFromBeUploaded,
  } = useSet<FileWithTags>();
  const {
    set: toBeProcessed,
    add: addToBeProcessed,
    remove: removeFromBeProcessed,
  } = useSet<FileProxy>();
  const { set: processedFiles, add: addProcessedFile } = useSet<FileProxy>();
  const {
    set: failedFiles,
    add: addFailedFile,
    remove: removeFromFailedFiles,
  } = useSet<FileProxy>();

  const [progress, setProgress] = useState<Map<string, number>>(new Map());

  const maxConcurrentUploads = useAppSelector(selectMaxConcurrentUploads);

  const markFileAsToBeUploaded = useCallback(
    (file: File, tags: ApiTag[], isPublic: boolean) => {
      const failedEntry = Array.from(failedFiles).find(
        (f) => f.name === file.name,
      );
      if (failedEntry) removeFromFailedFiles(failedEntry);
      addToBeUploaded({ file, tags, isPublic });
    },
    [addToBeUploaded, failedFiles, removeFromFailedFiles],
  );

  const markFileAsBeingProcessed = useCallback(
    (file: string) => {
      const fileObj = Array.from(toBeUploaded).find(
        (f) => f.file.name === file,
      );
      if (fileObj) {
        addToBeProcessed({
          name: fileObj.file.name,
          type: fileObj.file.type,
          status: "uploading",
        });
        removeFromBeUploaded(fileObj);
      }
    },
    [addToBeProcessed, removeFromBeUploaded, toBeUploaded],
  );

  const markFileAsProcessed = useCallback(
    (file: string) => {
      const fileObj = Array.from(toBeProcessed).find((f) => f.name === file);
      if (fileObj) {
        addProcessedFile({
          name: fileObj.name,
          type: fileObj.type,
          status: "success",
        });
        removeFromBeProcessed(fileObj);
        setProgress((prev) => {
          const next = new Map(prev);
          next.delete(file);
          return next;
        });
      }
    },
    [addProcessedFile, removeFromBeProcessed, toBeProcessed],
  );

  const markFileAsFailed = useCallback(
    (file: string, errorReason: string) => {
      const fileObj = Array.from(toBeProcessed).find((f) => f.name === file);
      if (fileObj) {
        addFailedFile({
          name: fileObj.name,
          type: fileObj.type,
          status: "failed",
          errorReason,
        });
        removeFromBeProcessed(fileObj);
        setProgress((prev) => {
          const next = new Map(prev);
          next.delete(file);
          return next;
        });
      }
    },
    [addFailedFile, removeFromBeProcessed, toBeProcessed],
  );

  const handleFileUploadSuccess = useCallback(
    (file: string) => {
      markFileAsProcessed(file);
    },
    [markFileAsProcessed],
  );
  const handleFileUploadFailure = useCallback(
    (file: string, errorReason: string) => {
      markFileAsFailed(file, errorReason);
    },
    [markFileAsFailed],
  );

  const {
    registerMessageHandler,
    unregisterMessageHandler,
    webSocketClientId,
  } = useWebSocketContext();

  useEffect(() => {
    const handleWebSocketMessage = (
      message: WebSocketIncomingMessageSchema,
    ) => {
      switch (message.type) {
        case "upload-finished":
          handleFileUploadSuccess(message.file);
          break;
        case "upload-failed":
          handleFileUploadFailure(message.file, message.reason);
          break;
        default:
          break;
      }
    };

    registerMessageHandler(handleWebSocketMessage);
    return () => {
      unregisterMessageHandler(handleWebSocketMessage);
    };
  }, [
    registerMessageHandler,
    unregisterMessageHandler,
    handleFileUploadFailure,
    handleFileUploadSuccess,
  ]);

  const markFileAsFailedRef = useRef(markFileAsFailed);
  markFileAsFailedRef.current = markFileAsFailed;

  useEffect(() => {
    if (toBeUploaded.size === 0 || !webSocketClientId) return;
    const slots = maxConcurrentUploads - toBeProcessed.size;
    if (slots <= 0) return;
    const batch = Array.from(toBeUploaded).slice(0, slots);
    batch.forEach(({ file, tags, isPublic }) => {
      markFileAsBeingProcessed(file.name);
      uploadDocumentWithProgress(
        { file, webSocketClientId, tags, isPublic },
        (pct) => setProgress((prev) => new Map(prev).set(file.name, pct)),
      )
        .then(() => {
          enhancedApi.util.invalidateTags(["document"]);
        })
        .catch((err) => {
          markFileAsFailedRef.current(
            file.name,
            err.message || "Upload failed",
          );
        });
    });
  }, [
    toBeUploaded,
    toBeProcessed,
    maxConcurrentUploads,
    markFileAsBeingProcessed,
    webSocketClientId,
  ]);

  return (
    <UploadContext.Provider
      value={{
        toBeUploaded,
        toBeProcessed,
        processedFiles,
        failedFiles,
        progress,

        markFileAsToBeUploaded,
        markFileAsBeingProcessed,
        markFileAsProcessed,
        markFileAsFailed,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};
