import { TagParser } from "@lars_hagemann/tags";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { twMerge } from "tailwind-merge";
import { useTagCompletion } from "../hooks/useTagCompletion";
import { Dropdown } from "../components/Dropdown";
import { getWordFromCursor } from "../util/getWordFromCursor";
import { useCursorPos } from "../hooks/useCursorPos";
import { replaceWordAtCursor } from "../util/replaceWordAtCursor";

type Props = {
  value: string;
  className?: string;
  direction?: React.ComponentProps<typeof Dropdown>["direction"];
  clearOnSubmit?: boolean;
  blurOnSubmit?: boolean;
  placeholder?: string;
  onChange: (newValue: string) => void;
  onSubmit: (newValue: string) => void;
  onValidChange?: (isValid: boolean) => void;
};

export const TagInput = ({
  value,
  className,
  direction = "down",
  clearOnSubmit = false,
  blurOnSubmit = false,
  placeholder,
  onChange,
  onValidChange,
  onSubmit,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { cursorPos } = useCursorPos(inputRef);

  const isValid = useMemo(() => {
    try {
      new TagParser(value).parse();
      return [true] as const;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown";
      return [false, message] as const;
    }
  }, [value]);

  useEffect(() => {
    onValidChange?.(isValid[0]);
  }, [isValid, onValidChange]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && isValid[0]) {
        onSubmit(value);
        if (clearOnSubmit) {
          onChange("");
        }
        if (blurOnSubmit) {
          inputRef.current?.blur();
        }
      }
    },
    [value, onSubmit, isValid, clearOnSubmit, onChange, blurOnSubmit],
  );

  const [focused, setFocused] = useState(false);

  const { word } = useMemo(
    () => getWordFromCursor(value, cursorPos),
    [value, cursorPos],
  );

  const { suggestions } = useTagCompletion(word);

  const onChangeHandler = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <>
      <div
        className={twMerge("text-gray-200 relative", className)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={onChangeHandler}
          onKeyDown={onKeyDown}
          className={twMerge(
            "p-2 outline-0 w-full border-1",
            !isValid[0] ? "border-red-500" : "border-gray-600",
            focused
              ? direction === "up"
                ? "rounded-b-md"
                : "rounded-t-md"
              : "rounded-md",
          )}
          title={isValid[0] ? undefined : isValid[1]}
          type="text"
          autoCorrect="false"
          autoComplete="false"
          autoCapitalize="false"
          spellCheck="false"
          placeholder={placeholder}
        />
        {focused && suggestions.length > 0 && (
          <Dropdown
            values={suggestions.map((s, index) => ({
              value: s.tag,
              key: index.toString(),
              node: `${s.tag} (${s.usageCount})`,
            }))}
            onSelect={(value) => {
              const { newText, newCursorPos } = replaceWordAtCursor(
                inputRef.current?.value || "",
                cursorPos,
                value,
              );
              onChange(newText);
              requestAnimationFrame(() => {
                inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
              });
            }}
            direction={direction}
          />
        )}
      </div>
    </>
  );
};
