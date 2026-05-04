import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const variants = {
  primary: "bg-accent hover:enabled:bg-accent-hover text-text-primary rounded",
  ghost: "text-text-muted hover:enabled:text-text-primary",
  danger: "bg-danger hover:enabled:bg-danger-hover text-text-primary rounded",
  outline: "border border-text-primary hover:enabled:bg-accent-hover rounded",
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
      "px-4 py-2 transition-colors cursor-pointer",
      variants[variant],
      disabled && "opacity-50 cursor-not-allowed",
      className,
    )}
  >
    {children}
  </button>
);
