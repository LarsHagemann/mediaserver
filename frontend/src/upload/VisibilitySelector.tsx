import { useTranslation } from "react-i18next";
import { MdLock, MdOutlineVisibility, MdPublic } from "react-icons/md";
import { twMerge } from "tailwind-merge";
import { Button } from "../components/Button";

export type Visibility = "private" | "public";

type Props = {
  value: Visibility;
  onChange: (value: Visibility) => void;
};

const toggleClass = (active: boolean) =>
  twMerge(
    "flex-1 flex items-center justify-center gap-2 text-sm border",
    active
      ? "bg-surface-2 border-accent-subtle text-text-primary"
      : "bg-transparent border-border text-text-muted hover:enabled:border-border-strong",
  );

export const VisibilitySelector = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="bg-surface-1 rounded-lg p-4 border border-border">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
        <MdOutlineVisibility size={14} />
        {t("pages.upload.visibilityLabel")}
      </div>
      <div className="flex gap-2 mb-3">
        <Button
          variant="ghost"
          className={toggleClass(value === "private")}
          onClick={() => onChange("private")}
        >
          <MdLock size={15} /> {t("pages.upload.private")}
        </Button>
        <Button
          variant="ghost"
          className={toggleClass(value === "public")}
          onClick={() => onChange("public")}
        >
          <MdPublic size={15} /> {t("pages.upload.public")}
        </Button>
      </div>
      <p className="text-sm text-text-muted leading-snug">
        {value === "private" ? (
          <>
            <strong className="text-text-secondary">
              {t("pages.upload.private")}
            </strong>{" "}
            — {t("pages.upload.privateDescription")}
          </>
        ) : (
          <>
            <strong className="text-text-secondary">
              {t("pages.upload.public")}
            </strong>{" "}
            — {t("pages.upload.publicDescription")}
          </>
        )}
      </p>
    </div>
  );
};
