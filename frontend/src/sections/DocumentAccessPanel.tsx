import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../app/api";
import { usePermission, useIdentity } from "../hooks/usePermission";
import { FaLock, FaGlobe, FaTimes } from "react-icons/fa";

type Props = {
  documentId: string;
};

export const DocumentAccessPanel = ({ documentId }: Props) => {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  const isAdmin = usePermission("admin:users");

  const {
    data: access,
    isLoading,
    isError,
  } = api.useGetDocumentAccessQuery(documentId);
  const { data: usersData } = api.useListUsersQuery(undefined, {
    skip: !isAdmin,
  });
  const [updateAccess] = api.useUpdateDocumentAccessMutation();

  const [selectedUserId, setSelectedUserId] = useState("");

  if (isLoading)
    return (
      <div className="text-sm text-text-secondary p-2">
        {t("common.loading")}
      </div>
    );
  if (isError || !access) return null;

  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

  const ownerUser = usersData?.users.find((u) => u.id === access.ownerId);
  const ownerLabel = ownerUser
    ? (ownerUser.name ?? ownerUser.email ?? ownerUser.externalId)
    : access.ownerId === SYSTEM_USER_ID
      ? "System"
      : access.ownerId === identity?.userId
        ? (identity.name ?? identity.email ?? t("common.you"))
        : access.ownerId;

  const shareUserIds = new Set(access.shares.map((s) => s.userId));

  const handleTogglePublic = () => {
    void updateAccess({
      id: documentId,
      isPublic: !access.isPublic,
      sharedWith: access.shares.map((s) => s.userId),
    });
  };

  const handleRemoveShare = (userId: string) => {
    void updateAccess({
      id: documentId,
      isPublic: access.isPublic,
      sharedWith: access.shares
        .map((s) => s.userId)
        .filter((id) => id !== userId),
    });
  };

  const handleAddShare = () => {
    if (!selectedUserId || shareUserIds.has(selectedUserId)) return;
    void updateAccess({
      id: documentId,
      isPublic: access.isPublic,
      sharedWith: [...access.shares.map((s) => s.userId), selectedUserId],
    });
    setSelectedUserId("");
  };

  const availableToAdd =
    usersData?.users.filter(
      (u) => u.id !== access.ownerId && !shareUserIds.has(u.id),
    ) ?? [];

  return (
    <div className="flex flex-col gap-4 p-3 text-sm w-full overflow-y-auto">
      <div>
        <span className="text-text-secondary text-xs uppercase tracking-wide">
          {t("document.access.owner")}
        </span>
        <div className="mt-1 font-medium">{ownerLabel}</div>
      </div>

      <div>
        <span className="text-text-secondary text-xs uppercase tracking-wide">
          {t("document.access.title")}
        </span>
        <button
          onClick={handleTogglePublic}
          className="mt-1 flex items-center gap-2 w-full p-2 rounded border border-border hover:border-border-strong transition-colors text-left"
        >
          {access.isPublic ? (
            <FaGlobe className="text-accent flex-shrink-0" />
          ) : (
            <FaLock className="text-text-secondary flex-shrink-0" />
          )}
          <div>
            <div className="font-medium">
              {access.isPublic
                ? t("document.access.public")
                : t("document.access.private")}
            </div>
            <div className="text-xs text-text-secondary">
              {access.isPublic
                ? t("document.access.publicDescription")
                : t("document.access.privateDescription")}
            </div>
          </div>
        </button>
      </div>

      {!access.isPublic && (
        <div>
          <span className="text-text-secondary text-xs uppercase tracking-wide">
            {t("document.access.sharedWith")}
          </span>
          <div className="mt-1 flex flex-col gap-1">
            {access.shares.length === 0 && (
              <div className="text-text-secondary italic">
                {t("document.access.noShares")}
              </div>
            )}
            {access.shares.map((share) => (
              <div
                key={share.userId}
                className="flex items-center justify-between p-2 rounded border border-border"
              >
                <span>{share.name ?? share.email ?? share.userId}</span>
                <button
                  onClick={() => handleRemoveShare(share.userId)}
                  className="text-danger-subtle hover:text-danger p-1 rounded transition-colors"
                  title={t("document.access.removeUser")}
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
                <option value="">{t("document.access.addUser")}</option>
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
        </div>
      )}
    </div>
  );
};
