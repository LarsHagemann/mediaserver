import { twMerge } from "tailwind-merge";

type Props = {
  min?: number;
  max: number;
  value: number;
  color?: string;
};

export const ProgressBar: React.FC<Props> = ({
  min = 0,
  max,
  value,
  color = "bg-accent-subtle",
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full bg-progress-track rounded-full h-4">
      <div
        className={twMerge(
          color,
          "h-4 rounded-full transition-all duration-300",
        )}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
