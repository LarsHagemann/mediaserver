import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MdLogout, MdAccessTime, MdDeleteOutline } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { useIdentity } from "../hooks/usePermission";
import { api } from "../app/api";
import { Tabs } from "../components/Tabs";
import { UserAvatar } from "../components/UserAvatar";

type Tab = "profile" | "sessions";

const getUsername = (email?: string | null, name?: string | null): string => {
  if (email) return "@" + email.split("@")[0];
  if (name) return "@" + name.toLowerCase().replace(/\s+/g, ".");
  return "";
};

export const AccountPage = () => {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();
  const [currentTab, setCurrentTab] = useState<Tab>("profile");
  const { data: sessionsData, isLoading: sessionsLoading } =
    api.useListSessionsQuery(undefined, { skip: currentTab !== "sessions" });
  const [deleteSession] = api.useDeleteSessionMutation();

  const username = getUsername(identity?.email, identity?.name);

  const handleLogout = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`;
  };

  return (
    <div className="p-4">
      {/* User header */}
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={identity?.name} email={identity?.email} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {identity?.name ?? identity?.email ?? t("account.user")}
          </h1>
          {username && (
            <p className="text-text-secondary text-sm">{username}</p>
          )}
        </div>
      </div>

      <Tabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        tabs={[
          { tabId: "profile", node: t("account.tabs.profile") },
          { tabId: "sessions", node: t("account.tabs.sessions") },
        ]}
        className="mb-6"
      />

      <div className="flex flex-col gap-3">
        {currentTab === "profile" && (
          <>
            {identity?.name && (
              <div className="flex flex-col gap-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">
                  {t("account.profile.name")}
                </p>
                <p className="text-text-primary">{identity.name}</p>
              </div>
            )}
            {identity?.email && (
              <div className="flex flex-col gap-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">
                  {t("account.profile.email")}
                </p>
                <p className="text-text-primary">{identity.email}</p>
              </div>
            )}
            {identity?.userId && (
              <div className="flex flex-col gap-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">
                  {t("account.profile.userId")}
                </p>
                <p className="text-text-secondary text-xs font-mono break-all">
                  {identity.userId}
                </p>
              </div>
            )}
          </>
        )}

        {currentTab === "sessions" && (
          <>
            {sessionsLoading && (
              <p className="text-text-secondary text-sm">
                {t("common.loading")}
              </p>
            )}
            {sessionsData?.sessions.map((session) => (
              <div
                key={session.id}
                className={twMerge(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  session.isCurrent
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface-3",
                )}
              >
                <MdAccessTime className="text-text-secondary w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">
                    {session.browser && session.os
                      ? `${session.browser} on ${session.os}`
                      : (session.browser ??
                        session.os ??
                        t("account.sessions.unknownDevice"))}
                  </p>
                  <p className="text-text-secondary text-xs">
                    {t("account.sessions.started", {
                      date: new Date(session.createdAt).toLocaleString(),
                    })}
                  </p>
                </div>
                {session.isCurrent ? (
                  <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {t("account.sessions.current")}
                  </span>
                ) : (
                  <button
                    onClick={() => deleteSession(session.id)}
                    title={t("account.sessions.delete")}
                    className="text-text-secondary hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <MdDeleteOutline size={18} />
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-500/50 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-colors"
        >
          <MdLogout size={16} />
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
};
