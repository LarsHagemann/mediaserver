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
import { MdSettings, MdCollections, MdLogout, MdLogin, MdPerson } from "react-icons/md";
import { useIdentity, usePermission } from "../hooks/usePermission";
import { UserAvatar } from "../components/UserAvatar";

const getUsername = (email?: string | null, name?: string | null): string => {
  if (email) return "@" + email.split("@")[0];
  if (name) return "@" + name.toLowerCase().replace(/\s+/g, ".");
  return "";
};

export const SideBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const { data: identity } = useIdentity();
  const canUpload = usePermission("document:upload");
  const canViewCollections = usePermission("collection:read");
  const canViewState = usePermission("admin:state");

  const username = getUsername(identity?.email, identity?.name);

  const handleLogin = () => {
    const redirectUri = window.location.href;
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const showAuth = identity?.userId !== "system";

  return (
    <div
      className={twMerge(
        "fixed z-40 flex flex-row w-full bottom-0 p-2 bg-surface-2 transition-all justify-between sm:flex-col sm:relative sm:h-[100vh] sm:justify-start",
        collapsed ? "sm:w-16" : "sm:w-1/7",
      )}
    >
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

      {collapsed && (
        <FaCaretRight
          size="48"
          className="hidden sm:block sm:absolute bottom-4 -right-6 bg-surface-2 rounded-full p-2 cursor-pointer hover:bg-surface-3 transition-colors border-2 border-border-strong"
          onClick={() => setCollapsed(false)}
        />
      )}
      {!collapsed && (
        <FaCaretLeft
          size="48"
          className="hidden sm:block sm:absolute bottom-4 -right-6 bg-surface-2 rounded-full p-2 cursor-pointer hover:bg-surface-3 transition-colors border-2 border-border-strong"
          onClick={() => setCollapsed(true)}
        />
      )}

      {showAuth && (
        <>
          {/* Mobile: compact icon in the bottom nav bar */}
          <button
            className="sm:hidden p-2 hover:bg-surface-1 rounded-sm transition-colors flex items-center justify-center"
            onClick={() =>
              navigate(identity?.isAuthenticated ? "/account" : "/login")
            }
          >
            {identity?.isAuthenticated ? (
              <UserAvatar name={identity.name} email={identity.email} size="sm" />
            ) : (
              <MdPerson className="w-8 h-8" />
            )}
          </button>

          {/* Desktop: full auth section pushed to bottom */}
          <div className="hidden sm:block sm:mt-auto sm:border-t sm:border-border-strong sm:pt-3 sm:pb-1">
            {collapsed ? (
              /* Collapsed: icon only */
              identity?.isAuthenticated ? (
                <div
                  className="flex justify-center cursor-pointer"
                  onClick={() => navigate("/account")}
                >
                  <UserAvatar name={identity.name} email={identity.email} size="sm" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <MdLogin
                    className="w-8 h-8 cursor-pointer hover:text-accent transition-colors"
                    onClick={handleLogin}
                  />
                </div>
              )
            ) : identity?.isAuthenticated ? (
              /* Expanded + signed in */
              <div>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-surface-1 rounded-sm p-1 transition-colors mb-3"
                  onClick={() => navigate("/account")}
                >
                  <UserAvatar name={identity.name} email={identity.email} size="sm" />
                  <div className="overflow-hidden">
                    <p className="text-text-primary text-sm font-semibold truncate">
                      {identity.name ?? identity.email ?? t("sidebar.user")}
                    </p>
                    {username && (
                      <p className="text-text-secondary text-xs truncate">{username}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`; }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-text-primary text-sm hover:bg-surface-1 transition-colors"
                >
                  <MdLogout size={14} />
                  {t("sidebar.logout")}
                </button>
              </div>
            ) : (
              /* Expanded + not signed in */
              <div>
                <p className="font-semibold text-sm text-text-primary">
                  {t("sidebar.notSignedIn")}
                </p>
                <p className="text-text-secondary text-xs mt-1 mb-3">
                  {t("sidebar.signInPrompt")}
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MdLogin size={14} />
                  {t("sidebar.login")}
                </button>
                <p className="text-text-secondary text-xs text-center mt-2">
                  {t("sidebar.registrationDisabled")}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
