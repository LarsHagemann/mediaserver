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
        "cursor-pointer px-3 py-2.5 rounded-md transition-colors duration-200 flex flex-row items-center gap-3 overflow-hidden hover:bg-surface-1",
        isActive ? "bg-surface-1" : "",
      )}
    >
      <IconComponent
        className={twMerge(
          "w-5 h-5 min-h-5 min-w-5 flex-shrink-0",
          isActive ? "text-accent-subtle" : "text-text-secondary",
        )}
      />
      {!collapsed && (
        <span
          className={twMerge(
            "hidden sm:block text-sm text-nowrap",
            isActive ? "text-text-primary font-medium" : "text-text-secondary",
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
};
