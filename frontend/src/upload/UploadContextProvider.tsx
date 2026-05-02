import React, { useCallback, useEffect, useRef } from "react";
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
import { enhancedApi } from "../app/enhancedApi";
import type { ApiTag } from "../app/api";

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
  const { set: failedFiles, add: addFailedFile } = useSet<FileProxy>();

  const markFileAsToBeUploaded = useCallback(
    (file: File, tags: ApiTag[]) => {
      addToBeUploaded({ file, tags });
    },
    [addToBeUploaded],
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

  const [uploadDocument] = enhancedApi.useDocumentUploadMutation();

  const markFileAsFailedRef = useRef(markFileAsFailed);
  markFileAsFailedRef.current = markFileAsFailed;

  useEffect(() => {
    if (toBeUploaded.size > 0 && webSocketClientId) {
      const { file, tags } = Array.from(toBeUploaded)[0];
      uploadDocument({
        file,
        webSocketClientId,
        tags,
      })
        .unwrap()
        .catch((err) => {
          markFileAsFailedRef.current(file.name, err.message || "Upload failed");
        });
      markFileAsBeingProcessed(file.name);
    }
  }, [
    toBeUploaded,
    uploadDocument,
    markFileAsBeingProcessed,
    markFileAsFailed,
    webSocketClientId,
  ]);

  return (
    <UploadContext.Provider
      value={{
        toBeUploaded,
        toBeProcessed,
        processedFiles,
        failedFiles,

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
