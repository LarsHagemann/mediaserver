import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "../pages/Layout";
import { GalleryPage } from "../pages/GalleryPage";
import { UploadPage } from "../pages/UploadPage";
import { TagsPage } from "../pages/TagsPage";
import { NavigateToGalleryPage } from "../pages/NavigateToGalleryPage";
import { StatePage } from "../pages/StatePage";
import { SettingsPage } from "../pages/SettingsPage";
import { CollectionsPage } from "../pages/CollectionsPage";
import { DuplicatesPage } from "../pages/DuplicatesPage";
import { LoginPage } from "../pages/LoginPage";
import { PermissionGuard } from "../components/PermissionGuard";
import type { PluginRoute } from "../plugins/plugin";
import { PluginRouteWrapper } from "../plugins/PluginRouteWrapper";

export function createAppRouter(pluginRoutes: PluginRoute[] = []) {
  return createBrowserRouter([
    {
      path: "/login",
      Component: LoginPage,
    },
    {
      path: "/",
      Component: Layout,
      children: [
        {
          index: true,
          Component: NavigateToGalleryPage,
        },
        {
          path: "account",
          element: <Navigate to="/settings" replace />,
        },
        {
          path: "gallery",
          Component: GalleryPage,
        },
        {
          path: "upload",
          element: (
            <PermissionGuard action="document:upload">
              <UploadPage />
            </PermissionGuard>
          ),
        },
        {
          path: "tags",
          Component: TagsPage,
        },
        {
          path: "duplicates",
          element: (
            <PermissionGuard action="document:read">
              <DuplicatesPage />
            </PermissionGuard>
          ),
        },
        {
          path: "state",
          element: (
            <PermissionGuard action="admin:state">
              <StatePage />
            </PermissionGuard>
          ),
        },
        {
          path: "settings",
          Component: SettingsPage,
        },
        {
          path: "collections",
          element: (
            <PermissionGuard action="collection:read">
              <CollectionsPage />
            </PermissionGuard>
          ),
        },
        ...pluginRoutes.map((route) => ({
          path: route.path.replace(/^\//, ""),
          element: <PluginRouteWrapper route={route} />,
        })),
      ],
    },
  ]);
}
