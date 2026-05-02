import { createBrowserRouter } from "react-router";
import { Layout } from "../pages/Layout";
import { GalleryPage } from "../pages/GalleryPage";
import { UploadPage } from "../pages/UploadPage";
import { TagsPage } from "../pages/TagsPage";
import { NavigateToGalleryPage } from "../pages/NavigateToGalleryPage";
import { StatePage } from "../pages/StatePage";
import { SettingsPage } from "../pages/SettingsPage";
import { CollectionsPage } from "../pages/CollectionsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: NavigateToGalleryPage,
      },
      {
        path: "gallery",
        Component: GalleryPage,
      },
      {
        path: "upload",
        Component: UploadPage,
      },
      {
        path: "tags",
        Component: TagsPage,
      },
      {
        path: "state",
        Component: StatePage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
      {
        path: "collections",
        Component: CollectionsPage,
      },
    ],
  },
]);
