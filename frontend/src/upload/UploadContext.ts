import { createContext, useContext } from "react";
import type { ApiTag } from "../app/api";

export type FileProxy = {
  type: string;
  name: string;
  status: "prepared" | "uploading" | "success" | "failed";
  errorReason?: string;
};

export type FileWithTags = {
  file: File;
  tags: ApiTag[];
  isPublic: boolean;
};

type UploadContextType = {
  toBeUploaded: Set<FileWithTags>;
  toBeProcessed: Set<FileProxy>;
  processedFiles: Set<FileProxy>;
  failedFiles: Set<FileProxy>;
  progress: Map<string, number>;

  markFileAsToBeUploaded: (
    file: File,
    tags: ApiTag[],
    isPublic: boolean,
  ) => void;
  markFileAsBeingProcessed: (file: string) => void;
  markFileAsProcessed: (file: string) => void;
  markFileAsFailed: (file: string, errorReason: string) => void;
};

export const UploadContext = createContext<UploadContextType | undefined>(
  undefined,
);

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUploadContext must be used within an UploadProvider");
  }
  return context;
};
