import { useCallback, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

type DropdownItem<T> = {
  value: T;
  key: string;
  node: React.ReactNode;
};

type Props<T> = {
  values: DropdownItem<T>[];
  className?: string;
  direction?: "up" | "down";
  onSelect?: (value: T) => void;
};

export const Dropdown = <T,>({
  values,
  className,
  direction = "down",
  onSelect,
}: Props<T>) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();

        setHighlightedIndex((prev) => Math.min(prev + 1, values.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();

        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
      } else if (
        event.key === "Enter" &&
        !event.ctrlKey &&
        highlightedIndex >= 0
      ) {
        event.preventDefault();
        event.stopPropagation();

        const item = values[highlightedIndex];
        if (item) {
          onSelect?.(item.value);
        }
      }
    },
    [highlightedIndex, onSelect, values],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [handleKeyDown]);

  return (
    <div
      className={twMerge(
        "absolute block bg-surface-1 -mt-2 border-b border-border-strong max-h-60 overflow-y-auto w-full z-90 text-text-secondary",
        direction === "up"
          ? "bottom-full rounded-t-md"
          : "top-full rounded-b-md",
        className,
      )}
    >
      {values.map(({ node, key }, index) => (
        <div
          key={key}
          className={twMerge(
            "px-2 py-1 block hover:bg-surface-3 cursor-pointer",
            index === highlightedIndex ? "bg-surface-3" : "",
          )}
          onMouseEnter={() => setHighlightedIndex(index)}
          onMouseDown={(e) => {
            // Prevent input from losing focus
            e.preventDefault();
            onSelect?.(values[index].value);
          }}
        >
          {node}
        </div>
      ))}
    </div>
  );
};
