import { type ReactNode } from "react";
import { MdClose } from "react-icons/md";
import { twMerge } from "tailwind-merge";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export const Modal = ({ isOpen, onClose, title, children, className }: Props) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay"
      onClick={onClose}
    >
      <div
        className={twMerge(
          "bg-surface-1 rounded-lg w-full max-w-lg mx-4 relative max-h-[90vh] overflow-y-hidden",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 px-6 pt-6">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <MdClose
            className="text-2xl cursor-pointer hover:text-danger-subtle transition-colors"
            onClick={onClose}
          />
        </div>
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
