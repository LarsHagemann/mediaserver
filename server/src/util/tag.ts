import type { ApiTag } from "../tags/TagRepository.js";

export const tagToString = (tag: ApiTag) =>
  `${tag.key}${tag.value ? `:${tag.value}` : ""}`;

export const stringToTag = (tag: string): ApiTag => {
  const parts = tag.split(":", 2);
  if (parts.length === 1) {
    return { key: parts[0]!.trim(), value: undefined, type: "default" };
  } else {
    return { key: parts[0]!.trim(), value: parts[1]!.trim(), type: "default" };
  }
};
