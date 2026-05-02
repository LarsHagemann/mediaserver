import type { IconType } from "react-icons";
import { useLocation } from "react-router";
import { twMerge } from "tailwind-merge";

type Props = {
  Icon: IconType;
  pathPrefix: string;
  text: string;
  collapsed: boolean;
  onClick?: () => void;
};

export const SideBarButton = ({
  Icon: IconComponent,
  pathPrefix,
  text,
  collapsed,
  onClick,
}: Props) => {
  const location = useLocation();
  const isActive = location.pathname === pathPrefix;

  return (
    <div
      onClick={onClick}
      className={twMerge(
        `cursor-pointer p-2 hover:bg-surface-1 rounded-sm transition-colors duration-200 sm:mb-2 flex flex-row items-center overflow-hidden`,
        isActive && "bg-surface-1",
      )}
    >
      <IconComponent className="w-8 h-8 min-h-8 min-w-8" />
      {!collapsed && (
        <span className="hidden sm:block ml-2 text-xl pl-2 text-nowrap">
          {text}
        </span>
      )}
    </div>
  );
};
