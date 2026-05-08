import { useMemo } from "react";
import { type Collection } from "../app/api";

export const useFinalGalleryQuery = (
  query: string | undefined,
  collectionSearchParam: string | undefined,
  collection: Collection | undefined,
): { finalQuery: string | undefined; hasRandomSort: boolean } => {
  const finalQuery = useMemo(() => {
    if (collectionSearchParam && collection) {
      const collectionFilter =
        collection.type === "static"
          ? `collection:${collection.id}`
          : `(${collection.filterExpression})`;

      if (!query?.trim()) {
        return collectionFilter;
      }

      return `(${collectionFilter}) & (${query})`;
    }
    return query;
  }, [collectionSearchParam, collection, query]);

  const hasRandomSort = (query ?? "").includes("sort:random");

  return { finalQuery, hasRandomSort };
};
