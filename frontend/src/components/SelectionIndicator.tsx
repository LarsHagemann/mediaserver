import { BiLoader } from "react-icons/bi";
import { IconButton } from "./IconButton";
import { twMerge } from "tailwind-merge";
import { FaRegCheckCircle, FaRegCircle } from "react-icons/fa";

const sizes = {
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "w-8 h-8",
};

type Props = {
  isLoading?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  size?: keyof typeof sizes;
};

export const SelectionIndicator = ({
  isLoading,
  selected,
  onSelect,
  size = "medium",
}: Props) => {
  if (isLoading) {
    return <BiLoader className={`animate-spin ${sizes[size]}`} />;
  }

  return (
    <IconButton
      className={twMerge(
        "text-lg text-text-muted hover:text-text-primary flex-shrink-0",
        sizes[size],
        selected && "text-green-500 hover:text-green-600",
      )}
      onClick={() => onSelect?.(!selected)}
    >
      {selected ? (
        <FaRegCheckCircle className={sizes[size]} />
      ) : (
        <FaRegCircle className={sizes[size]} />
      )}
    </IconButton>
  );
};
