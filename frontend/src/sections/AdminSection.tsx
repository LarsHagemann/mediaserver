import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type AdminUser } from "../app/api";
import { Tabs } from "../components/Tabs";
import { RolesEditor2 } from "./RolesEditor2";

const UsersTab = () => {
  const { t } = useTranslation();
  const { data: usersData, isLoading: usersLoading } = api.useListUsersQuery();
  const { data: rolesData, isLoading: rolesLoading } = api.useListRolesQuery();
  const [setUserRoles] = api.useSetUserRolesMutation();

  if (usersLoading || rolesLoading) return <div>{t("common.loading")}</div>;

  const toggleUserRole = (user: AdminUser, roleId: string) => {
    const currentIds = user.roles.map((r) => r.id);
    const newIds = currentIds.includes(roleId)
      ? currentIds.filter((id) => id !== roleId)
      : [...currentIds, roleId];
    void setUserRoles({ userId: user.id, roleIds: newIds });
  };

  return (
    <div className="flex flex-col gap-3">
      {usersData?.users.length === 0 && (
        <p className="text-text-secondary text-sm">{t("admin.users.empty")}</p>
      )}
      {usersData?.users.map((user) => (
        <div key={user.id} className="p-4 border border-border rounded-lg">
          <div className="mb-2">
            <span className="font-semibold">{user.name ?? user.email ?? user.externalId}</span>
            {user.email && user.name && (
              <span className="ml-2 text-sm text-text-secondary">{user.email}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {rolesData?.roles.map((role) => (
              <button
                key={role.id}
                onClick={() => toggleUserRole(user, role.id)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  user.roles.some((r) => r.id === role.id)
                    ? "bg-accent border-accent text-white"
                    : "border-border text-text-secondary hover:border-border-strong"
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ConfigTab = () => {
  const { t } = useTranslation();
  const { data: config, isLoading: configLoading } = api.useGetAuthConfigQuery();
  const { data: rolesData, isLoading: rolesLoading } = api.useListRolesQuery();
  const [updateConfig] = api.useUpdateAuthConfigMutation();

  if (configLoading || rolesLoading) return <div>{t("common.loading")}</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t("admin.config.anonymousRole")}</label>
        <select
          className="px-3 py-2 rounded border border-border bg-bg-base text-sm"
          value={config?.anonymousRoleId ?? ""}
          onChange={(e) => void updateConfig({ anonymousRoleId: e.target.value || undefined })}
        >
          <option value="">{t("admin.config.noRole")}</option>
          {rolesData?.roles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <p className="text-xs text-text-secondary">{t("admin.config.anonymousRoleHint")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{t("admin.config.defaultRole")}</label>
        <select
          className="px-3 py-2 rounded border border-border bg-bg-base text-sm"
          value={config?.defaultRoleId ?? ""}
          onChange={(e) => void updateConfig({ defaultRoleId: e.target.value || undefined })}
        >
          <option value="">{t("admin.config.noRole")}</option>
          {rolesData?.roles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <p className="text-xs text-text-secondary">{t("admin.config.defaultRoleHint")}</p>
      </div>
    </div>
  );
};

type AdminTab = "roles" | "users" | "config";

export const AdminSection = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>("roles");

  const tabs = [
    { tabId: "roles" as const, node: t("admin.tabs.roles") },
    { tabId: "users" as const, node: t("admin.tabs.users") },
    { tabId: "config" as const, node: t("admin.tabs.config") },
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        currentTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-4"
      />
      {activeTab === "roles" && <RolesEditor2 />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "config" && <ConfigTab />}
    </div>
  );
};
