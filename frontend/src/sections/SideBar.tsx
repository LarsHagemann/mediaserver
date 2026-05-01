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
import { MdSettings, MdCollections } from "react-icons/md";

export const SideBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={twMerge(
        "fixed z-40 flex flex-row w-full bottom-0 p-2 bg-gray-700 transition-all justify-between sm:flex-col sm:relative sm:h-[100vh] sm:inline-block sm:justify-start",
        collapsed ? "sm:w-16" : "sm:w-1/7",
      )}
    >
      <SideBarButton
        Icon={RiGalleryView2}
        pathPrefix="/gallery"
        onClick={() => {
          navigate("/gallery");
        }}
        collapsed={collapsed}
        text={t("sidebar.gallery")}
      />
      <SideBarButton
        Icon={AiOutlineUpload}
        pathPrefix="/upload"
        onClick={() => {
          navigate("/upload");
        }}
        collapsed={collapsed}
        text={t("sidebar.upload")}
      />
      <SideBarButton
        Icon={FaHashtag}
        pathPrefix="/tags"
        onClick={() => {
          navigate("/tags");
        }}
        collapsed={collapsed}
        text={t("sidebar.tags")}
      />
      <SideBarButton
        Icon={MdCollections}
        pathPrefix="/collections"
        onClick={() => {
          navigate("/collections");
        }}
        collapsed={collapsed}
        text={t("sidebar.collections")}
      />
      <SideBarButton
        Icon={BiSolidServer}
        pathPrefix="/state"
        onClick={() => {
          navigate("/state");
        }}
        collapsed={collapsed}
        text={t("sidebar.serverState")}
      />
      <SideBarButton
        Icon={MdSettings}
        pathPrefix="/settings"
        onClick={() => {
          navigate("/settings");
        }}
        collapsed={collapsed}
        text={t("sidebar.settings")}
      />
      {collapsed && (
        <FaCaretRight
          size="48"
          className="hidden sm:block sm:absolute bottom-4 -right-6 bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-gray-500"
          onClick={() => setCollapsed(false)}
        />
      )}
      {!collapsed && (
        <FaCaretLeft
          size="48"
          className="hidden sm:block sm:absolute bottom-4 -right-6 bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-600 transition-colors border-2 border-gray-500"
          onClick={() => setCollapsed(true)}
        />
      )}
    </div>
  );
};
