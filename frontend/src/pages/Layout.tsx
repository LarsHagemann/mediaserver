import { Outlet } from "react-router";
import { SideBar } from "../sections/SideBar";

export const Layout = () => {
  return (
    <div className="flex flex-row h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] sm:h-full sm:max-h-[100vh] overflow-hidden">
      <SideBar />
      <div className="flex-1 max-h-full max-w-full h-[calc(100vh-64px)] sm:h-[100vh] overflow-y-auto overflow-x-hidden bg-bg-base">
        <Outlet />
      </div>
    </div>
  );
};
