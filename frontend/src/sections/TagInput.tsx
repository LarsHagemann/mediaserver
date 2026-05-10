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
import { useSelector, useDispatch } from "react-redux";
import { selectTagInputEasyMode, setTagInputEasyMode } from "../app/persistent.slice";
import { useTranslation } from "react-i18next";
import { MdClose } from "react-icons/md";
import { HiMagnifyingGlass } from "react-icons/hi2";

type Props = {
  value: string;
  className?: string;
  direction?: React.ComponentProps<typeof Dropdown>["direction"];
  clearOnSubmit?: boolean;
  blurOnSubmit?: boolean;
  placeholder?: string;
  showSearchIcon?: boolean;
  onChange: (newValue: string) => void;
  onSubmit: (newValue: string) => void;
  onValidChange?: (isValid: boolean) => void;
};

const parseQueryToChips = (query: string): string[] => {
  if (!query.trim()) return [];
  return query
    .split("&")
    .map((s) => s.trim().replace(/^\(+|\)+$/g, "").trim())
    .filter((s) => s.length > 0);
};

export const TagInput = ({
  value,
  className,
  direction = "down",
  clearOnSubmit = false,
  blurOnSubmit = false,
  placeholder,
  showSearchIcon = false,
  onChange,
  onValidChange,
  onSubmit,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const easyMode = useSelector(selectTagInputEasyMode);

  // --- Advanced mode ---
  const advInputRef = useRef<HTMLInputElement>(null);
  const { cursorPos } = useCursorPos(advInputRef);
  const [advFocused, setAdvFocused] = useState(false);

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

  const { word } = useMemo(
    () => getWordFromCursor(value, cursorPos),
    [value, cursorPos],
  );

  const { suggestions: advSuggestions } = useTagCompletion(word);

  const onAdvKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Enter" && isValid[0]) {
        onSubmit(value);
        if (clearOnSubmit) onChange("");
        if (blurOnSubmit) advInputRef.current?.blur();
      }
    },
    [value, onSubmit, isValid, clearOnSubmit, onChange, blurOnSubmit],
  );

  const onAdvChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  // --- Easy mode ---
  const easyInputRef = useRef<HTMLInputElement>(null);
  const [easyInput, setEasyInput] = useState("");
  const [easyFocused, setEasyFocused] = useState(false);
  const [easyHighlightedIndex, setEasyHighlightedIndex] = useState(-1);
  const { suggestions: easySuggestions } = useTagCompletion(easyInput);

  useEffect(() => {
    setEasyHighlightedIndex(-1);
  }, [easySuggestions]);

  const chips = useMemo(() => parseQueryToChips(value), [value]);

  const removeChip = useCallback(
    (index: number) => {
      const newChips = chips.filter((_, i) => i !== index);
      const newQuery = newChips.join(" & ");
      onChange(newQuery);
      onSubmit(newQuery);
    },
    [chips, onChange, onSubmit],
  );

  const addChip = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const newChips = [...chips, trimmed];
      const newQuery = newChips.join(" & ");
      onChange(newQuery);
      onSubmit(newQuery);
      if (clearOnSubmit) onChange("");
      setEasyInput("");
      setEasyHighlightedIndex(-1);
      if (blurOnSubmit) easyInputRef.current?.blur();
    },
    [chips, onChange, onSubmit, clearOnSubmit, blurOnSubmit],
  );

  const onEasyKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setEasyHighlightedIndex((i) => Math.min(i + 1, easySuggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setEasyHighlightedIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        if (easyHighlightedIndex >= 0 && easySuggestions[easyHighlightedIndex]) {
          addChip(easySuggestions[easyHighlightedIndex].tag);
        } else {
          addChip(easyInput);
        }
      } else if (e.key === "Backspace" && easyInput === "" && chips.length > 0) {
        removeChip(chips.length - 1);
      } else if (e.key === "Escape") {
        setEasyHighlightedIndex(-1);
      }
    },
    [easyInput, addChip, chips, removeChip, easySuggestions, easyHighlightedIndex],
  );

  const toggleButton = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        dispatch(setTagInputEasyMode(!easyMode));
      }}
      className="shrink-0 text-text-muted hover:text-text-primary transition-colors text-xs px-1.5 py-0.5 rounded border border-border-subtle cursor-pointer whitespace-nowrap"
      title={easyMode ? t("pages.gallery.switchToAdvancedMode") : t("pages.gallery.switchToEasyMode")}
    >
      {easyMode ? t("pages.gallery.advancedMode") : t("pages.gallery.easyMode")}
    </button>
  );

  if (easyMode) {
    const showSuggestions = easyFocused && easySuggestions.length > 0;
    return (
      <div className={twMerge("text-text-primary", className)}>
        <div
          className={twMerge(
            "border border-border-subtle flex items-center gap-2 px-3 py-2 relative cursor-text",
            showSuggestions ? "rounded-t-md" : "rounded-md",
          )}
          onClick={() => easyInputRef.current?.focus()}
        >
          {showSearchIcon && (
            <HiMagnifyingGlass className="text-text-muted shrink-0" size={16} />
          )}
          <div className="flex flex-wrap gap-1.5 flex-1 items-center min-w-0">
            {chips.map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-md bg-chip-bg text-chip-text text-xs font-medium shrink-0"
              >
                {chip}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(i);
                  }}
                  className="text-text-muted hover:text-text-primary cursor-pointer flex items-center"
                >
                  <MdClose size={13} />
                </button>
              </span>
            ))}
            <input
              ref={easyInputRef}
              value={easyInput}
              onChange={(e) => setEasyInput(e.target.value)}
              onKeyDown={onEasyKeyDown}
              onFocus={() => setEasyFocused(true)}
              onBlur={() => setEasyFocused(false)}
              className="flex-1 min-w-24 outline-none bg-transparent text-text-primary text-sm placeholder:text-text-muted"
              placeholder={
                chips.length === 0
                  ? placeholder
                  : t("pages.gallery.easyModeAddPlaceholder")
              }
              autoCorrect="false"
              autoComplete="off"
              autoCapitalize="false"
              spellCheck="false"
            />
          </div>
          {toggleButton}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-surface-1 border border-t-0 border-border-strong rounded-b-md max-h-60 overflow-y-auto z-90">
              {easySuggestions.map((s, i) => (
                <div
                  key={s.tag}
                  className={twMerge(
                    "px-3 py-1.5 text-sm text-text-secondary cursor-pointer hover:bg-surface-3",
                    i === easyHighlightedIndex ? "bg-surface-3" : "",
                  )}
                  onMouseEnter={() => setEasyHighlightedIndex(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addChip(s.tag);
                  }}
                >
                  {s.tag}
                  <span className="ml-1.5 text-text-muted text-xs">({s.usageCount})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Advanced mode
  return (
    <div
      className={twMerge("text-text-primary relative", className)}
      onFocus={() => setAdvFocused(true)}
      onBlur={() => setAdvFocused(false)}
    >
      <input
        ref={advInputRef}
        value={value}
        onChange={onAdvChange}
        onKeyDown={onAdvKeyDown}
        className={twMerge(
          "p-2 pr-[52px] outline-0 w-full border-1",
          !isValid[0] ? "border-danger-strong" : "border-border-subtle",
          advFocused
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
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        {toggleButton}
      </div>
      {advFocused && advSuggestions.length > 0 && (
        <Dropdown
          values={advSuggestions.map((s, index) => ({
            value: s.tag,
            key: index.toString(),
            node: `${s.tag} (${s.usageCount})`,
          }))}
          onSelect={(val) => {
            const { newText, newCursorPos } = replaceWordAtCursor(
              advInputRef.current?.value || "",
              cursorPos,
              val,
            );
            onChange(newText);
            requestAnimationFrame(() => {
              advInputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            });
          }}
          direction={direction}
        />
      )}
    </div>
  );
};
