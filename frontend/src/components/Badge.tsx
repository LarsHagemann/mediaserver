import { FaTimes } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onDelete?: () => void;
};

export const Badge: React.FC<Props> = ({
  children,
  className,
  onClick,
  onDelete,
}) => {
  return (
    <div
      className={twMerge(
        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border border-border",
        "bg-accent-dim text-accent-muted",
        className,
        onClick && "cursor-pointer hover:bg-opacity-80 hover:border-strong",
      )}
      onClick={onClick}
    >
      {children}
      {onDelete && (
        <FaTimes
          className="w-3 h-3 text-current opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      )}
    </div>
  );
};
