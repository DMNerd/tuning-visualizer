import { memo } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FaGithub } from "react-icons/fa";
import { FiGlobe, FiSun, FiMoon, FiMonitor } from "react-icons/fi";
import { SUPPORTED_LANGUAGES } from "@shared/i18n";

// Product name; not translated
const APP_NAME = "TuningViz";

function PanelHeader({ theme, setTheme /* lefty, setLefty (unused) */ }) {
  const { t, i18n } = useTranslation();
  const setAuto = () => setTheme("auto");
  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");

  const isAuto = theme === "auto";
  const isLight = theme === "light";
  const isDark = theme === "dark";
  const appVersion = import.meta.env.DEV
    ? "dev"
    : `v${import.meta.env.VITE_APP_VERSION}`;

  return (
    <div className="tv-header">
      <h1 className="tv-header__title">
        {APP_NAME} <span className="tv-header__version">{appVersion}</span>
      </h1>

      <div className="tv-header__actions">
        <div className="tv-header__toggles">
          {/* Theme segmented control (Auto / Light / Dark) */}
          <div
            className="tv-theme"
            role="group"
            aria-label={t("header.themeGroup")}
          >
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isAuto })}
              aria-pressed={isAuto}
              onClick={setAuto}
              title={t("header.themeAutoTitle")}
            >
              <FiMonitor aria-hidden="true" />
              <span className="tv-theme__label">{t("header.themeAuto")}</span>
            </button>
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isLight })}
              aria-pressed={isLight}
              onClick={setLight}
              title={t("header.themeLightTitle")}
            >
              <FiSun aria-hidden="true" />
              <span className="tv-theme__label">{t("header.themeLight")}</span>
            </button>
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isDark })}
              aria-pressed={isDark}
              onClick={setDark}
              title={t("header.themeDarkTitle")}
            >
              <FiMoon aria-hidden="true" />
              <span className="tv-theme__label">{t("header.themeDark")}</span>
            </button>
          </div>

          <label className="tv-language" title={t("header.language")}>
            <FiGlobe className="tv-language__icon" aria-hidden="true" />
            <span className="tv-u-visually-hidden">{t("header.language")}</span>
            <select
              className="tv-language__select"
              value={i18n.resolvedLanguage}
              onChange={(e) => void i18n.changeLanguage(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code} lang={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <a
          className="tv-header__link"
          href="https://github.com/DMNerd/tuning-visualizer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("header.github")}
          title={t("header.github")}
        >
          <FaGithub />
        </a>
      </div>
    </div>
  );
}

export default memo(PanelHeader);
