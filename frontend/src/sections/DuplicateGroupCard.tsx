import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiLoader } from "react-icons/bi";
import { MdLock, MdPublic } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";
import type { ApiTag, DuplicateGroup, DuplicateGroupMember } from "../app/api";
import { Button } from "../components/Button";
import { TagList } from "../components/TagList";
import { useThumbnail } from "../hooks/useThumbnail";
import { bytesToHumanReadable } from "../util/bytesToHumanReadable";
import { tagToString, stringToTag } from "../util/tag";
import { TagInput } from "./TagInput";

type Props = {
  group: DuplicateGroup;
  onResolve: (request: {
    keepId: string;
    mergeIds: string[];
    tagsToAdd: ApiTag[];
    tagsToRemove: ApiTag[];
  }) => Promise<void>;
};

const MemberTile = ({
  member,
  isKeeper,
  onSelect,
}: {
  member: DuplicateGroupMember;
  isKeeper: boolean;
  onSelect: () => void;
}) => {
  const { t } = useTranslation();
  const { objectUrl, isLoading } = useThumbnail(member.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isKeeper}
      className={twMerge(
        "flex flex-col gap-2 p-3 rounded-md border text-left transition-colors cursor-pointer w-[180px] shrink-0",
        isKeeper
          ? "border-accent bg-surface-2"
          : "border-border hover:bg-surface-2",
      )}
    >
      <div className="relative w-full h-[120px] bg-surface-3 rounded overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <BiLoader className="animate-spin text-text-muted" />
        ) : (
          <img
            src={objectUrl}
            alt={member.friendlyName}
            className="max-w-full max-h-full object-contain"
          />
        )}
        {isKeeper && (
          <span className="absolute top-1 right-1 bg-accent text-text-primary text-[10px] px-2 py-0.5 rounded-full">
            {t("duplicates.keeping")}
          </span>
        )}
      </div>
      <p
        className="text-sm text-text-primary truncate"
        title={member.friendlyName}
      >
        {member.friendlyName}
      </p>
      <div className="flex flex-col gap-0.5 text-xs text-text-muted">
        <span>
          {DateTime.fromISO(member.createdAt).toLocaleString(
            DateTime.DATETIME_MED,
          )}
        </span>
        {member.ownerName && (
          <span className="truncate">{member.ownerName}</span>
        )}
        <span className="flex items-center gap-1">
          {member.isPublic ? (
            <>
              <MdPublic className="w-3 h-3" /> {t("duplicates.public")}
            </>
          ) : (
            <>
              <MdLock className="w-3 h-3" /> {t("duplicates.private")}
            </>
          )}
        </span>
        <span>{t("duplicates.tagCount", { count: member.tags.length })}</span>
      </div>
    </button>
  );
};

export const DuplicateGroupCard = ({ group, onResolve }: Props) => {
  const { t } = useTranslation();
  const [keepId, setKeepId] = useState(group.documents[0]?.id ?? "");
  const [tagsToAdd, setTagsToAdd] = useState<ApiTag[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<ApiTag[]>([]);
  const [query, setQuery] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // What the kept document ends up tagged with: everything any copy carried,
  // minus the user's removals, plus their additions.
  const mergedTags = useMemo(() => {
    const byKey = new Map<string, ApiTag>();
    for (const document of group.documents) {
      for (const tag of document.tags) {
        byKey.set(tagToString(tag), tag);
      }
    }
    for (const tag of tagsToAdd) {
      byKey.set(tagToString(tag), tag);
    }
    for (const tag of tagsToRemove) {
      byKey.delete(tagToString(tag));
    }
    return [...byKey.values()];
  }, [group.documents, tagsToAdd, tagsToRemove]);

  const toggleTag = useCallback(
    (tag: ApiTag) => {
      const key = tagToString(tag);
      const wasInherited = group.documents.some((document) =>
        document.tags.some((t) => tagToString(t) === key),
      );

      if (tagsToAdd.some((t) => tagToString(t) === key)) {
        setTagsToAdd((prev) => prev.filter((t) => tagToString(t) !== key));
      } else if (tagsToRemove.some((t) => tagToString(t) === key)) {
        setTagsToRemove((prev) => prev.filter((t) => tagToString(t) !== key));
      } else if (wasInherited) {
        setTagsToRemove((prev) => [...prev, tag]);
      } else {
        setTagsToAdd((prev) => [...prev, tag]);
      }
    },
    [group.documents, tagsToAdd, tagsToRemove],
  );

  const onSubmitTag = useCallback(
    (value: string) => {
      if (value.trim()) toggleTag(stringToTag(value));
      setQuery("");
    },
    [toggleTag],
  );

  const mergeIds = useMemo(
    () =>
      group.documents
        .map((document) => document.id)
        .filter((id) => id !== keepId),
    [group.documents, keepId],
  );

  // A group whose copies belong to different people can only be resolved by an
  // admin, and deleting someone else's document deserves an explicit warning.
  const owners = useMemo(
    () => new Set(group.documents.map((document) => document.ownerId)),
    [group.documents],
  );

  const onConfirm = useCallback(async () => {
    setIsResolving(true);
    try {
      await onResolve({ keepId, mergeIds, tagsToAdd, tagsToRemove });
    } finally {
      setIsResolving(false);
    }
  }, [onResolve, keepId, mergeIds, tagsToAdd, tagsToRemove]);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border border-border bg-surface-1">
      <div className="flex flex-row flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-text-primary font-semibold">
          {t("duplicates.groupTitle", { count: group.documentCount })}
        </h3>
        <p className="text-sm text-text-muted">
          {t("duplicates.groupMeta", {
            size: bytesToHumanReadable(group.sizeBytes),
            reclaimable: bytesToHumanReadable(group.reclaimableBytes),
          })}
        </p>
      </div>

      {owners.size > 1 && (
        <p className="text-sm text-warning">
          {t("duplicates.multipleOwnersWarning", { count: owners.size })}
        </p>
      )}

      <div className="flex flex-row gap-3 overflow-x-auto pb-1">
        {group.documents.map((member) => (
          <MemberTile
            key={member.id}
            member={member}
            isKeeper={member.id === keepId}
            onSelect={() => setKeepId(member.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("duplicates.resultingTags")}
        </p>
        <TagInput
          value={query}
          onChange={setQuery}
          onSubmit={onSubmitTag}
          placeholder={t("duplicates.addTagPlaceholder")}
        />
        {mergedTags.length > 0 ? (
          <TagList tags={mergedTags} onClick={toggleTag} />
        ) : (
          <p className="text-sm text-text-muted">{t("duplicates.noTags")}</p>
        )}
      </div>

      <Button
        onClick={onConfirm}
        disabled={isResolving || mergeIds.length === 0}
        className="self-end flex flex-row items-center gap-2"
      >
        {isResolving && <BiLoader className="animate-spin" />}
        {t("duplicates.mergeConfirm", { count: mergeIds.length })}
      </Button>
    </div>
  );
};
