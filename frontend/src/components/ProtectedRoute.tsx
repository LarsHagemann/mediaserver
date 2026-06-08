import type { ReactNode } from "react";
import { useIdentity } from "../hooks/usePermission";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { data: identity, isLoading } = useIdentity();

  if (isLoading) return null;

  if (!identity?.isAuthenticated) {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/login`;
    return null;
  }

  return <>{children}</>;
};
