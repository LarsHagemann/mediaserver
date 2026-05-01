import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const IconButton = ({ className, children, ...props }: Props) => (
  <button
    {...props}
    className={twMerge("transition-colors bg-transparent cursor-pointer", className)}
  >
    {children}
  </button>
);
