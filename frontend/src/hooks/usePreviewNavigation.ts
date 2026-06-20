import { useCallback, useMemo, useRef } from "react";
import { type Document } from "../app/api";

type Params = {
  previewDocumentSearchParam: string | undefined;
  idToDocument: Record<string, Document>;
  limit: number;
  page: number;
  addSearchParam: (key: "preview", value: string) => void;
  removeSearchParam: (key: "preview") => void;
  setSearchParams: (
    updater: (prev: URLSearchParams) => URLSearchParams,
  ) => void;
};

export const usePreviewNavigation = ({
  previewDocumentSearchParam,
  idToDocument,
  limit,
  page,
  addSearchParam,
  removeSearchParam,
  setSearchParams,
}: Params) => {
  const previewDocument = useMemo(
    () =>
      previewDocumentSearchParam
        ? idToDocument[previewDocumentSearchParam]
        : undefined,
    [idToDocument, previewDocumentSearchParam],
  );

  const lastKnownPreviewIndexRef = useRef<number>(0);
  if (previewDocument) {
    lastKnownPreviewIndexRef.current = previewDocument.queryIndex;
  }

  const setPreviewDocument = useCallback(
    (previewDocumentId: string | undefined) => {
      if (previewDocumentId) {
        addSearchParam("preview", previewDocumentId);
      } else {
        removeSearchParam("preview");
      }
    },
    [addSearchParam, removeSearchParam],
  );

  // Navigates the preview to a specific document, also switching to the page
  // that contains it. This keeps the document present in `idToDocument` so the
  // next/prev handlers resolve correctly even when the document lives outside
  // the currently loaded gallery page (e.g. when clicking a thumbnail near a
  // page boundary in the preview strip).
  const goToPreviewDocument = useCallback(
    (document: Document) => {
      const targetPage = Math.floor(document.queryIndex / limit);
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("page", String(targetPage + 1));
        newParams.set("preview", document.id);
        return newParams;
      });
    },
    [setSearchParams, limit],
  );

  const nextPreviewImage = useCallback(() => {
    if (previewDocument?.nextId) {
      const nextId = previewDocument.nextId;
      const indexOnPage = previewDocument.queryIndex % limit;
      if (indexOnPage === limit - 1) {
        const newPage = page + 1;
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("page", String(newPage + 1));
          newParams.set("preview", nextId);
          return newParams;
        });
      } else {
        setPreviewDocument(nextId);
      }
    }
  }, [setPreviewDocument, previewDocument, setSearchParams, page, limit]);

  const prevPreviewImage = useCallback(() => {
    if (previewDocument?.previousId) {
      const previousId = previewDocument.previousId;
      const indexOnPage = previewDocument.queryIndex % limit;
      if (indexOnPage === 0) {
        const newPage = Math.max(page - 1, 0);
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("page", String(newPage + 1));
          newParams.set("preview", previousId);
          return newParams;
        });
      } else {
        setPreviewDocument(previewDocument.previousId);
      }
    }
  }, [setPreviewDocument, previewDocument, setSearchParams, page, limit]);

  return {
    previewDocument,
    setPreviewDocument,
    goToPreviewDocument,
    nextPreviewImage,
    prevPreviewImage,
    lastKnownPreviewIndexRef,
  };
};
