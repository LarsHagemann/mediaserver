import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const variants = {
  primary:
    "bg-blue-600 hover:enabled:bg-blue-500 text-white rounded",
  ghost:
    "text-gray-400 hover:enabled:text-white",
  danger:
    "bg-red-700 hover:enabled:bg-red-600 text-white rounded",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
};

export const Button = ({
  variant = "primary",
  className,
  disabled,
  children,
  ...props
}: Props) => (
  <button
    {...props}
    disabled={disabled}
    className={twMerge(
      "px-4 py-2 transition-colors",
      variants[variant],
      disabled && "opacity-50 cursor-not-allowed",
      className,
    )}
  >
    {children}
  </button>
);
