import { AiOutlineUpload } from "react-icons/ai";
import { RiGalleryView2 } from "react-icons/ri";
import { FaCaretLeft, FaHashtag } from "react-icons/fa";
import { SideBarButton } from "../components/SideBarButton";
import { useNavigate } from "react-router";
import { BiSolidServer } from "react-icons/bi";
import { FaCaretRight } from "react-icons/fa6";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { MdSettings, MdCollections, MdLogout } from "react-icons/md";
import { useIdentity, usePermission } from "../hooks/usePermission";
import { UserAvatar } from "../components/UserAvatar";

const getUsername = (email?: string | null, name?: string | null): string => {
  if (email) return "@" + email.split("@")[0];
  if (name) return "@" + name.toLowerCase().replace(/\s+/g, ".");
  return "";
};

const SectionLabel = ({ label }: { label: string }) => (
  <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-widest text-text-faint uppercase select-none">
    {label}
  </p>
);

export const SideBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { data: identity } = useIdentity();
  const canUpload = usePermission("document:upload");
  const canViewCollections = usePermission("collection:read");
  const canViewState = usePermission("admin:state");

  const username = getUsername(identity?.email, identity?.name);
  const showAuth = identity?.userId !== "system";

  return (
    <div
      className={twMerge(
        "fixed z-40 flex flex-row w-full bottom-0 p-2 bg-surface-1 transition-all justify-between sm:flex-col sm:relative sm:h-[100vh] sm:justify-start sm:p-3",
        collapsed ? "sm:w-16" : "sm:w-1/7",
      )}
    >
      {/* Logo */}
      {!collapsed && (
        <div className="hidden sm:flex items-center gap-3 px-3 py-4 mb-1">
          <div className="w-9 h-9 rounded-lg bg-accent-subtle flex items-center justify-center flex-shrink-0">
            <RiGalleryView2 className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-text-primary font-semibold text-sm leading-tight truncate">
              Mediaserver
            </p>
          </div>
        </div>
      )}

      {/* Workspace section */}
      {!collapsed && <SectionLabel label={t("sidebar.workspace", "Workspace")} />}
      <SideBarButton
        Icon={RiGalleryView2}
        pathPrefix="/gallery"
        onClick={() => navigate("/gallery")}
        collapsed={collapsed}
        text={t("sidebar.gallery")}
      />
      {canUpload && (
        <SideBarButton
          Icon={AiOutlineUpload}
          pathPrefix="/upload"
          onClick={() => navigate("/upload")}
          collapsed={collapsed}
          text={t("sidebar.upload")}
        />
      )}
      <SideBarButton
        Icon={FaHashtag}
        pathPrefix="/tags"
        onClick={() => navigate("/tags")}
        collapsed={collapsed}
        text={t("sidebar.tags")}
      />
      {canViewCollections && (
        <SideBarButton
          Icon={MdCollections}
          pathPrefix="/collections"
          onClick={() => navigate("/collections")}
          collapsed={collapsed}
          text={t("sidebar.collections")}
        />
      )}

      {/* System section */}
      {(canViewState || true) && !collapsed && (
        <SectionLabel label={t("sidebar.system", "System")} />
      )}
      {canViewState && (
        <SideBarButton
          Icon={BiSolidServer}
          pathPrefix="/state"
          onClick={() => navigate("/state")}
          collapsed={collapsed}
          text={t("sidebar.serverState")}
        />
      )}
      <SideBarButton
        Icon={MdSettings}
        pathPrefix="/settings"
        onClick={() => navigate("/settings")}
        collapsed={collapsed}
        text={t("sidebar.settings")}
      />

      {/* Collapse toggle */}
      {collapsed ? (
        <FaCaretRight
          size="40"
          className="hidden sm:block sm:absolute bottom-4 -right-5 bg-surface-1 rounded-full p-2 cursor-pointer hover:bg-surface-2 transition-colors border border-border"
          onClick={() => setCollapsed(false)}
        />
      ) : (
        <FaCaretLeft
          size="40"
          className="hidden sm:block sm:absolute bottom-4 -right-5 bg-surface-1 rounded-full p-2 cursor-pointer hover:bg-surface-2 transition-colors border border-border"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* User section */}
      {showAuth && identity?.isAuthenticated && (
        <div className="hidden sm:block sm:mt-auto sm:border-t sm:border-border sm:pt-3">
          {collapsed ? (
            <div
              className="flex justify-center cursor-pointer"
              onClick={() => navigate("/account")}
            >
              <UserAvatar name={identity.name} email={identity.email} size="sm" />
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-surface-2 transition-colors mb-1"
                onClick={() => navigate("/account")}
              >
                <UserAvatar name={identity.name} email={identity.email} size="sm" />
                <div className="overflow-hidden">
                  <p className="text-text-primary text-sm font-semibold truncate leading-tight">
                    {identity.name ?? identity.email ?? t("sidebar.user")}
                  </p>
                  {username && (
                    <p className="text-text-muted text-xs truncate">{username}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`;
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-text-secondary text-sm hover:bg-surface-2 transition-colors"
              >
                <MdLogout className="w-5 h-5 flex-shrink-0" />
                {t("sidebar.logout")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
