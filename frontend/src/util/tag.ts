import type { ApiTag } from "../app/api";

export const tagToString = (tag: ApiTag) =>
  `${tag.key}${tag.value ? `:${tag.value}` : ""}`;

export const stringToTag = (tag: string, type: string = "default"): ApiTag => {
  const parts = tag.split(":", 2);
  if (parts.length === 1) {
    return { key: parts[0]!.trim(), type };
  } else {
    return { key: parts[0]!.trim(), value: parts[1]!.trim(), type };
  }
};
