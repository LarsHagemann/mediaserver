import { twMerge } from "tailwind-merge";

type Props = {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
};

export const UserAvatar = ({ name, email, size = "md" }: Props) => {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (email?.slice(0, 2).toUpperCase() ?? "?");

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-2xl",
  }[size];

  return (
    <div
      className={twMerge(
        "rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0",
        sizeClasses,
      )}
    >
      {initials}
    </div>
  );
};
