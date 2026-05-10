import { useEffect, useState } from "react";

type ObjectMetadata = {
  blob: Blob;
  url: string;
};

const objectMap: Map<string, ObjectMetadata> = new Map();

export const useFileDownload = (url: string, skip = false) => {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<unknown | undefined>(undefined);
  const [blob, setBlob] = useState<Blob | undefined>(undefined);

  useEffect(() => {
    if (skip) {
      setIsLoading(false);
      return;
    }

    if (objectMap.has(url)) {
      const metadata = objectMap.get(url)!;
      const { blob, url: objectUrl } = metadata;
      setObjectUrl(objectUrl);
      setBlob(blob);
      setIsLoading(false);
      return;
    }

    fetch(url, { credentials: "include" })
      .then((data) => data.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        setObjectUrl(objectUrl);
        setBlob(blob);
        objectMap.set(url, { blob, url: objectUrl });
      })
      .catch((error) => setError(error))
      .finally(() => setIsLoading(false));
  }, [url, skip]);

  return { objectUrl, isLoading, error, blob, remoteUrl: url };
};
