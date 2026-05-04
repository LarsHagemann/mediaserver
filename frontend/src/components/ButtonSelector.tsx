import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  options: { label: string; value: string }[];
  className?: string;
} & (
  | {
      values: string[];
      onSelected: (values: string[]) => void;
      multiChoice: true;
    }
  | {
      value: string;
      onSelected: (value: string) => void;
      multiChoice: false;
    }
);

export const ButtonSelector = ({ options, className, ...rest }: Props) => {
  const toggleValue = (optionValue: string) => {
    if (rest.multiChoice) {
      if (rest.values.includes(optionValue)) {
        rest.onSelected(rest.values.filter((v) => v !== optionValue));
      } else {
        rest.onSelected([...rest.values, optionValue]);
      }
    } else {
      rest.onSelected(optionValue);
    }
  };

  const internalValues = useMemo(() => {
    if (rest.multiChoice) {
      return rest.values;
    } else {
      return [rest.value];
    }
  }, [rest]);

  return (
    <div className={twMerge("flex flex-row", className)}>
      {options.map((option, idx) => (
        <button
          key={idx}
          type="button"
          className={`flex-1 py-2 text-sm transition-colors cursor-pointer ${
            internalValues.includes(option.value)
              ? "bg-accent text-text-primary"
              : "bg-surface-2 text-text-secondary hover:bg-surface-3"
          }`}
          onClick={() => toggleValue(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
