import { useTranslation } from "react-i18next";
import { LanguageSelector } from "../sections/LanguageSelector";
import { fileTypes } from "../plugins/addFileTypePlugin";
import { themePlugins } from "../plugins/addThemePlugin";
import { applyTheme } from "../plugins/applyTheme";
import { Icon } from "../components/Icon";
import { standardTranslations, translations } from "../i18n";
import { reactIcons } from "../plugins/plugin";
import { isPluginTrusted } from "../hooks/useIsPluginTrusted";
import { useAppDispatch, useAppSelector } from "../app/store";
import { setActiveTheme, selectActiveThemeName } from "../app/persistent.slice";
import { standardThemes } from "../plugins/standardThemes";
import type { ThemePlugin } from "../../../plugin/frontend-types/types/plugin";

export const SettingsPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeThemeName = useAppSelector(selectActiveThemeName);

  const languages = Object.keys(translations).filter(
    (lng) => lng !== "languages",
  );

  const handleThemeSelect = (plugin: ThemePlugin | null) => {
    applyTheme(plugin);
    dispatch(setActiveTheme(plugin?.name ?? null));
  };

  const isThemeTrusted = (plugin: ThemePlugin) =>
    standardThemes.some((t) => t.name === plugin.name);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t("settings.title")}</h1>
      <LanguageSelector className="absolute right-4 top-4" />

      <h2 className="text-xl font-semibold mb-2">{t("settings.themes")}</h2>
      <div className="flex flex-row flex-wrap gap-3 mb-6">
        {themePlugins.map((plugin) => {
          const isActive = activeThemeName === plugin.name ||
            (activeThemeName === null && plugin.name === "dark");
          return (
            <button
              key={plugin.name}
              onClick={() => handleThemeSelect(plugin)}
              className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isActive ? "border-accent" : "border-border hover:border-border-strong"
                }`}
            >
              <div className="flex flex-row gap-1">
                {plugin.preview && (
                  <>
                    <div
                      className="w-6 h-6 rounded-full border border-border-strong"
                      style={{ backgroundColor: plugin.preview.background }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-border-strong"
                      style={{ backgroundColor: plugin.preview.accent }}
                    />
                  </>
                )}
              </div>
              <span className="text-sm font-medium">{plugin.description}</span>
              {!isThemeTrusted(plugin) && (
                <span className="text-xs text-warning">{t("settings.plugin.untrusted")}</span>
              )}
            </button>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold mb-2">
        {t("settings.loadedTranslations")}
      </h2>
      {languages.map((lng) => (
        <div key={lng} className="mb-4 p-4 border rounded">
          <span className="font-semibold">{t(`languages.${lng}.name`)}</span> (
          {t(`languages.${lng}.localName`)}) - {t(`languages.${lng}.flag`)}
          <div>
            {t(`settings.languageExtension.trusted`)}:{" "}
            {t(
              "settings.languageExtension." +
              (lng in standardTranslations ? "yes" : "no"),
            )}
          </div>
        </div>
      ))}

      <h2 className="text-xl font-semibold mb-2">
        {t("settings.loadedPlugins")}
      </h2>
      {fileTypes.map((plugin, index) => (
        <div key={index} className="mb-4 p-4 border rounded">
          <Icon
            Icon={plugin.icon(reactIcons)}
            size="medium"
            className="inline"
          />
          <span className="ml-2 font-semibold">{plugin.description}</span>
          <div>
            {t(`settings.plugin.trusted`)}:{" "}
            {t("settings.plugin." + (isPluginTrusted(plugin) ? "yes" : "no"))}
          </div>
        </div>
      ))}
    </div>
  );
};
