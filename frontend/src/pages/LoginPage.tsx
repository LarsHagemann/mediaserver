import { useTranslation } from "react-i18next";
import { MdLogin, MdInfo, MdPersonAdd } from "react-icons/md";
import { AppIcon } from "../components/AppIcon";
import { useIdentity } from "../hooks/usePermission";

export const LoginPage = () => {
  const { t } = useTranslation();
  const { data: identity } = useIdentity();

  const registrationAllowed = identity?.registrationAllowed ?? false;

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/login`;
  };

  const handleRegister = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/register`;
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <div className="flex-1 sm:hidden" />

      <div className="bg-surface-2 rounded-t-2xl p-6 sm:rounded-xl sm:m-auto sm:w-full sm:max-w-sm">
        <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6 sm:hidden" />

        <div className="mb-5">
          <AppIcon />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-1">{t("login.title")}</h1>
        <p className="text-text-secondary text-sm mb-6">{t("login.redirectNotice")}</p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity mb-3"
        >
          <MdLogin size={18} />
          {t("login.signIn")}
        </button>

        {registrationAllowed ? (
          <button
            onClick={handleRegister}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border text-text-primary text-sm font-medium hover:bg-surface-3 transition-colors"
          >
            <MdPersonAdd size={16} />
            {t("login.register")}
          </button>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-3 border border-border">
            <MdInfo className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-text-secondary text-xs">{t("login.registrationDisabledNotice")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
