import { useState, useEffect } from "react";
import { Modal } from "../components/Modal";
import { TagInput } from "./TagInput";
import { enhancedApi } from "../app/enhancedApi";
import { api } from "../app/api";
import type { Collection, CollectionType } from "../app/api";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { FaGlobe, FaLock, FaTimes } from "react-icons/fa";
import { usePermission, useIdentity } from "../hooks/usePermission";

type SaveData = {
  name: string;
  description: string | null;
  filterExpression: string;
  isFavorite: boolean;
  type: CollectionType;
  isPublic: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveData) => void;
  initialCollection?: Collection;
  initialFilterExpression?: string;
};

export const CollectionFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialCollection,
  initialFilterExpression = "",
}: Props) => {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  const isAdmin = usePermission("admin:users");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filterExpression, setFilterExpression] = useState("");
  const [isFilterValid, setIsFilterValid] = useState(true);
  const [type, setType] = useState<CollectionType>("dynamic");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  const isEditing = !!initialCollection;
  const effectiveType = isEditing ? initialCollection.type : type;
  const showTypeSelector = !isEditing && !initialFilterExpression;

  useEffect(() => {
    if (isOpen) {
      setName(initialCollection?.name ?? "");
      setDescription(initialCollection?.description ?? "");
      setFilterExpression(
        initialCollection?.filterExpression ?? initialFilterExpression,
      );
      setIsFilterValid(true);
      setType(initialCollection?.type ?? "dynamic");
      setIsPublic(initialCollection?.isPublic ?? true);
      setSelectedUserId("");
    }
  }, [isOpen, initialCollection, initialFilterExpression]);

  const { data: previewData } = enhancedApi.useListDocumentsQuery(
    { limit: 1, offset: 0, query: filterExpression },
    {
      skip:
        effectiveType === "static" || !isFilterValid || filterExpression === "",
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  const { data: access, isLoading: isAccessLoading } =
    api.useGetCollectionAccessQuery(initialCollection?.id ?? "", {
      skip: !isEditing || !isOpen,
    });

  const { data: usersData } = api.useListUsersQuery(undefined, {
    skip: !isAdmin || !isEditing,
  });

  const [updateAccess] = api.useUpdateCollectionAccessMutation();

  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

  const isValid =
    name.trim().length > 0 && (effectiveType === "static" || isFilterValid);

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      filterExpression,
      isFavorite: initialCollection?.isFavorite ?? false,
      type: effectiveType,
      isPublic,
    });
  };

  const handleRemoveShare = (userId: string) => {
    if (!access || !initialCollection) return;
    void updateAccess({
      id: initialCollection.id,
      isPublic: access.isPublic,
      sharedWith: access.shares
        .map((s) => s.userId)
        .filter((id) => id !== userId),
    });
  };

  const handleAddShare = () => {
    if (!access || !initialCollection || !selectedUserId) return;
    const shareUserIds = new Set(access.shares.map((s) => s.userId));
    if (shareUserIds.has(selectedUserId)) return;
    void updateAccess({
      id: initialCollection.id,
      isPublic: access.isPublic,
      sharedWith: [...access.shares.map((s) => s.userId), selectedUserId],
    });
    setSelectedUserId("");
  };

  const title = isEditing
    ? t("collections.editCollection")
    : t("collections.newCollection");

  const canManageAccess =
    isEditing && access && (isAdmin || access.ownerId === identity?.userId);

  const ownerUser = usersData?.users.find((u) => u.id === access?.ownerId);
  const ownerLabel = ownerUser
    ? (ownerUser.name ?? ownerUser.email ?? ownerUser.externalId)
    : access?.ownerId === SYSTEM_USER_ID
      ? "System"
      : access?.ownerId === identity?.userId
        ? (identity?.name ?? identity?.email ?? t("common.you"))
        : access?.ownerId;

  const shareUserIds = new Set(access?.shares.map((s) => s.userId) ?? []);
  const availableToAdd =
    usersData?.users.filter(
      (u) => u.id !== access?.ownerId && !shareUserIds.has(u.id),
    ) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {showTypeSelector && (
          <div>
            <label className="block text-sm text-text-muted mb-1">
              {t("collections.form.type")}
            </label>
            <div className="flex rounded overflow-hidden border border-border-subtle">
              <button
                type="button"
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "dynamic"
                    ? "bg-accent text-text-primary"
                    : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                }`}
                onClick={() => setType("dynamic")}
              >
                {t("collections.form.typeDynamic")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm transition-colors ${
                  type === "static"
                    ? "bg-accent text-text-primary"
                    : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                }`}
                onClick={() => setType("static")}
              >
                {t("collections.form.typeStatic")}
              </button>
            </div>
            <p className="text-xs text-text-faint mt-1">
              {type === "dynamic"
                ? t("collections.form.typeDynamicHint")
                : t("collections.form.typeStaticHint")}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm text-text-muted mb-1">
            {t("collections.form.name")} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-2 border border-border-subtle rounded p-2 text-text-primary outline-none focus:border-accent-hover"
            placeholder={t("collections.form.namePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1">
            {t("collections.form.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-2 border border-border-subtle rounded p-2 text-text-primary outline-none focus:border-accent-hover resize-none h-20"
            placeholder={t("collections.form.descriptionPlaceholder")}
          />
        </div>

        {effectiveType === "dynamic" && (
          <div>
            <label className="block text-sm text-text-muted mb-1">
              {t("collections.form.filterExpression")} *
            </label>
            <TagInput
              value={filterExpression}
              onChange={setFilterExpression}
              onSubmit={() => {}}
              onValidChange={setIsFilterValid}
              placeholder={t("collections.form.filterPlaceholder")}
            />
            {isFilterValid && filterExpression !== "" && (
              <p className="text-sm text-text-muted mt-1">
                {t("collections.docCount", { count: previewData?.total ?? 0 })}
              </p>
            )}
          </div>
        )}

        {effectiveType === "static" && isEditing && (
          <p className="text-xs text-text-faint">
            {t("collections.form.staticFilterNote")}
          </p>
        )}

        <div>
          <label className="block text-sm text-text-muted mb-1">
            {t("collection.access.title")}
          </label>
          <div className="flex rounded overflow-hidden border border-border-subtle">
            <button
              type="button"
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition-colors ${
                isPublic
                  ? "bg-accent text-text-primary"
                  : "bg-surface-2 text-text-secondary hover:bg-surface-3"
              }`}
              onClick={() => setIsPublic(true)}
            >
              <FaGlobe size={12} />
              {t("collection.access.public")}
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm flex items-center justify-center gap-2 transition-colors ${
                !isPublic
                  ? "bg-accent text-text-primary"
                  : "bg-surface-2 text-text-secondary hover:bg-surface-3"
              }`}
              onClick={() => setIsPublic(false)}
            >
              <FaLock size={12} />
              {t("collection.access.private")}
            </button>
          </div>
          <p className="text-xs text-text-faint mt-1">
            {isPublic
              ? t("collection.access.publicDescription")
              : t("collection.access.privateDescription")}
          </p>
        </div>

        {isEditing && !isAccessLoading && canManageAccess && !isPublic && (
          <div>
            <span className="block text-sm text-text-muted mb-1">
              {t("collection.access.sharedWith")}
            </span>
            <div className="flex flex-col gap-1">
              {(access?.shares.length ?? 0) === 0 && (
                <div className="text-text-secondary italic text-sm">
                  {t("collection.access.noShares")}
                </div>
              )}
              {access?.shares.map((share) => (
                <div
                  key={share.userId}
                  className="flex items-center justify-between p-2 rounded border border-border"
                >
                  <span className="text-sm">
                    {share.name ?? share.email ?? share.userId}
                  </span>
                  <button
                    onClick={() => handleRemoveShare(share.userId)}
                    className="text-danger-subtle hover:text-danger p-1 rounded transition-colors"
                    title={t("collection.access.removeUser")}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
            {isAdmin && availableToAdd.length > 0 && (
              <div className="mt-2 flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 text-sm border border-border rounded p-1 bg-surface-1 text-text-primary"
                >
                  <option value="">{t("collection.access.addUser")}</option>
                  {availableToAdd.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email ?? u.externalId}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddShare}
                  disabled={!selectedUserId}
                  className="px-2 py-1 rounded bg-accent text-white text-xs disabled:opacity-50 hover:bg-accent/80 transition-colors"
                >
                  +
                </button>
              </div>
            )}
            {isAdmin && access && (
              <div className="mt-2 text-xs text-text-secondary">
                {t("collection.access.owner")}:{" "}
                <span className="text-text-primary">{ownerLabel}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose}>
            {t("collections.form.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {t("collections.form.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
