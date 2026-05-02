import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

export const useEasySearchParams = <RelevantSearchParams extends string>(
  searchParamKeys: RelevantSearchParams[],
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const addSearchParam = useCallback(
    (
      key: RelevantSearchParams,
      value: string,
      mode: "overwrite" | "append" = "overwrite",
    ) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (mode === "overwrite") {
          newParams.set(key, value);
        } else {
          newParams.append(key, value);
        }
        return newParams;
      });
    },
    [setSearchParams],
  );

  const removeSearchParam = useCallback(
    (key: RelevantSearchParams) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(key);
        return newParams;
      });
    },
    [setSearchParams],
  );

  const getSearchParam = useCallback(
    (key: RelevantSearchParams) => {
      return searchParams.get(key);
    },
    [searchParams],
  );

  const params = useMemo(() => {
    return Object.fromEntries(
      searchParamKeys.map((key) => [key, searchParams.get(key) ?? undefined]),
    ) as Record<RelevantSearchParams, string | undefined>;
  }, [searchParams, searchParamKeys]);

  return {
    searchParams,
    setSearchParams,
    params,
    getSearchParam,
    addSearchParam,
    removeSearchParam,
  };
};
