import { Outlet } from "react-router";
import { SideBar } from "../sections/SideBar";
import { useIdentity } from "../hooks/usePermission";
import { api } from "../app/api";
import { LoginPage } from "./LoginPage";
import { PendingApprovalPage } from "./PendingApprovalPage";

export const Layout = () => {
  const { data: identity, isLoading: identityLoading } = useIdentity();
  const { data: config, isLoading: configLoading } = api.useGetAppConfigQuery();

  if (identityLoading || configLoading || !identity || !config) return null;

  const permissions = identity.permissions ?? [];

  if (
    config.idpEnabled &&
    !identity.isAuthenticated &&
    permissions.length === 0
  ) {
    return <LoginPage />;
  }

  if (
    config.idpEnabled &&
    identity.isAuthenticated &&
    permissions.length === 0
  ) {
    return <PendingApprovalPage />;
  }

  return (
    <div className="flex flex-row h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] sm:h-full sm:max-h-[100vh] overflow-hidden">
      <SideBar />
      <div className="flex-1 max-h-full max-w-full h-[calc(100vh-64px)] sm:h-[100vh] overflow-y-auto overflow-x-hidden bg-bg-base">
        <Outlet />
      </div>
    </div>
  );
};
