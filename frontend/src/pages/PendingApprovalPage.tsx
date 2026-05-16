import { useTranslation } from "react-i18next";
import { MdLogout, MdHourglassEmpty } from "react-icons/md";
import { AppIcon } from "../components/AppIcon";

export const PendingApprovalPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="flex-1 sm:hidden" />

      <div className="bg-surface-2 rounded-t-2xl p-6 sm:rounded-xl sm:m-auto sm:w-full sm:max-w-sm">
        <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6 sm:hidden" />

        <div className="mb-5">
          <AppIcon />
        </div>

        <div className="flex items-center gap-2 mb-1">
          <MdHourglassEmpty className="w-5 h-5 text-text-secondary flex-shrink-0" />
          <h1 className="text-xl font-bold text-text-primary">
            {t("pendingApproval.title")}
          </h1>
        </div>
        <p className="text-text-secondary text-sm mb-6">
          {t("pendingApproval.description")}
        </p>

        <button
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`;
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors"
        >
          <MdLogout size={16} />
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
};
