import { RiGalleryView2 } from "react-icons/ri";
import { twMerge } from "tailwind-merge";

const sizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
}

const iconSizes: Record<keyof typeof sizes, string> = {
  sm: "w-3 h-3",
  md: "w-4.5 h-4.5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
}

type Props = {
  size?: keyof typeof sizes;
}

export const AppIcon = ({ size = "xl" }: Props) => (
  <div className={twMerge('rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center', sizes[size])}>
    <RiGalleryView2 className={twMerge('text-white', iconSizes[size])} />
  </div>
);
