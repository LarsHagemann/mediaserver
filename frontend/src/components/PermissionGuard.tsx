import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { usePermission, useIdentity } from "../hooks/usePermission";

type Props = {
  action: string;
  children: ReactNode;
  fallback?: string;
};

export const PermissionGuard = ({ action, children, fallback = "/gallery" }: Props) => {
  const { isLoading } = useIdentity();
  const has = usePermission(action);

  if (isLoading) return null;
  if (!has) return <Navigate to={fallback} replace />;
  return <>{children}</>;
};
