import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type AdminRole } from "../app/api";

const NS_CONFIG: Record<string, { prefix: string; label: string; color: string }> = {
  documents: { prefix: "DC", label: "Documents", color: "bg-indigo-600" },
  tags: { prefix: "TG", label: "Tags", color: "bg-teal-600" },
  collections: { prefix: "CL", label: "Collections", color: "bg-emerald-600" },
  admin: { prefix: "AD", label: "Administration", color: "bg-orange-500" },
};

const groupActions = (actions: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};
  for (const action of actions) {
    const ns = action.split(":")[0];
    if (!groups[ns]) groups[ns] = [];
    groups[ns].push(action);
  }
  return groups;
};

type ActionGroupProps = {
  namespace: string;
  actions: string[];
  enabledActions: string[];
  onToggle?: (action: string) => void;
};

const ActionGroup = ({ namespace, actions, enabledActions, onToggle }: ActionGroupProps) => {
  const cfg = NS_CONFIG[namespace] ?? {
    prefix: namespace.slice(0, 2).toUpperCase(),
    label: namespace,
    color: "bg-gray-500",
  };
  const enabledCount = actions.filter((a) => enabledActions.includes(a)).length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`${cfg.color} text-white text-xs font-bold px-1.5 py-0.5 rounded leading-none`}>
          {cfg.prefix}
        </span>
        <span className="text-sm font-medium">{cfg.label}</span>
        <span className="text-xs text-text-secondary ml-auto tabular-nums">
          {enabledCount}/{actions.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => {
          const label = action.split(":")[1] ?? action;
          const active = enabledActions.includes(action);
          return (
            <button
              key={action}
              onClick={onToggle ? () => onToggle(action) : undefined}
              disabled={!onToggle}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                active
                  ? "bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400"
                  : "border-border text-text-secondary"
              } ${onToggle ? "hover:opacity-75 cursor-pointer" : "cursor-default"}`}
            >
              {active && <span className="mr-0.5">✓</span>}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

type RoleCardProps = {
  role: AdminRole;
  groupedActions: Record<string, string[]>;
  userCount?: number;
  onToggle?: (action: string) => void;
  onDelete?: () => void;
};

const RoleCard = ({ role, groupedActions, userCount, onToggle, onDelete }: RoleCardProps) => {
  const { t } = useTranslation();
  const totalActions = Object.values(groupedActions).flat().length;

  return (
    <div className="p-4 border border-border rounded-lg flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">{role.name}</span>
          {role.isSystem && (
            <span className="text-xs font-semibold bg-purple-500/10 border border-purple-400/40 text-purple-500 px-1.5 py-0.5 rounded leading-none">
              SYSTEM
            </span>
          )}
          {role.description && (
            <span className="text-sm text-text-secondary">{role.description}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {userCount !== undefined && (
            <span className="text-xs text-text-secondary">
              {userCount} {t("admin.roles.users")}
            </span>
          )}
          <span className="text-xs text-text-secondary tabular-nums">
            {role.policies.length}/{totalActions} {t("admin.roles.permissions")}
          </span>
          {!role.isSystem && onDelete && (
            <button onClick={onDelete} className="text-xs text-danger hover:opacity-80">
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
        {Object.entries(groupedActions).map(([ns, actions]) => (
          <ActionGroup
            key={ns}
            namespace={ns}
            actions={actions}
            enabledActions={role.policies}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};

export const RolesEditor = () => {
  const { t } = useTranslation();
  const { data, isLoading } = api.useListRolesQuery();
  const { data: actionsData } = api.useGetActionsQuery();
  const { data: usersData } = api.useListUsersQuery();
  const [createRole] = api.useCreateRoleMutation();
  const [deleteRole] = api.useDeleteRoleMutation();
  const [addPolicy] = api.useAddRolePolicyMutation();
  const [removePolicy] = api.useRemoveRolePolicyMutation();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const availableActions = actionsData?.actions ?? [];
  const groupedActions = groupActions(availableActions);
  const systemRoles = data?.roles.filter((r) => r.isSystem) ?? [];
  const customRoles = data?.roles.filter((r) => !r.isSystem) ?? [];

  const userCountFor = (roleId: string) =>
    usersData?.users.filter((u) => u.roles.some((r) => r.id === roleId)).length;

  const handleCreate = async () => {
    if (!newRoleName.trim()) return;
    await createRole({ name: newRoleName.trim(), description: newRoleDesc.trim() || undefined });
    setNewRoleName("");
    setNewRoleDesc("");
  };

  const togglePolicy = (role: AdminRole, action: string) => {
    if (role.policies.includes(action)) {
      void removePolicy({ roleId: role.id, action });
    } else {
      void addPolicy({ roleId: role.id, action });
    }
  };

  if (isLoading) return <div>{t("common.loading")}</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 p-3 border border-border rounded-lg">
        <input
          className="w-56 px-3 py-1.5 rounded border border-border bg-bg-base text-sm"
          placeholder={t("admin.roles.namePlaceholder")}
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
        />
        <input
          className="flex-1 px-3 py-1.5 rounded border border-border bg-bg-base text-sm"
          placeholder={t("admin.roles.descriptionPlaceholder")}
          value={newRoleDesc}
          onChange={(e) => setNewRoleDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
        />
        <button
          onClick={() => void handleCreate()}
          disabled={!newRoleName.trim()}
          className="px-4 py-1.5 rounded bg-accent text-white text-sm hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          + {t("admin.roles.createRole")}
        </button>
      </div>

      {systemRoles.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold tracking-widest text-text-secondary uppercase">
              {t("admin.roles.systemSection")}
            </span>
            <span className="text-xs text-text-secondary">{t("admin.roles.systemSectionHint")}</span>
          </div>
          {systemRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              groupedActions={groupedActions}
              userCount={userCountFor(role.id)}
            />
          ))}
        </div>
      )}

      {customRoles.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-widest text-text-secondary uppercase">
            {t("admin.roles.customSection")}
          </span>
          {customRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              groupedActions={groupedActions}
              userCount={userCountFor(role.id)}
              onToggle={(action) => togglePolicy(role, action)}
              onDelete={() => void deleteRole(role.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
