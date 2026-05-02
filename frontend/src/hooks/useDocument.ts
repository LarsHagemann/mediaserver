import { useFileDownload } from "./useFileDownload";
import { useDocumentUrl } from "./useDocumentUrl";

export const useDocument = (id: string, skip = false) => {
  const url = useDocumentUrl(id);
  return useFileDownload(url, skip);
};
