import React from "react";
import clsx from "clsx";
import { FaGithub } from "react-icons/fa";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

function PanelHeader({ theme, setTheme /* lefty, setLefty (unused) */ }) {
  const setAuto = () => setTheme("auto");
  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");

  const isAuto = theme === "auto";
  const isLight = theme === "light";
  const isDark = theme === "dark";

  return (
    <div className="tv-header">
      <h1 className="tv-header__title">TunningViz</h1>

      <div className="tv-header__actions">
        <div className="tv-header__toggles">
          {/* Theme segmented control (Auto / Light / Dark) */}
          <div className="tv-theme" role="group" aria-label="Theme mode">
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isAuto })}
              aria-pressed={isAuto}
              onClick={setAuto}
              title="Auto theme (follow system)"
            >
              <FiMonitor aria-hidden="true" />
              <span className="tv-theme__label">Auto</span>
            </button>
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isLight })}
              aria-pressed={isLight}
              onClick={setLight}
              title="Light theme"
            >
              <FiSun aria-hidden="true" />
              <span className="tv-theme__label">Light</span>
            </button>
            <button
              type="button"
              className={clsx("tv-theme__option", { "is-active": isDark })}
              aria-pressed={isDark}
              onClick={setDark}
              title="Dark theme"
            >
              <FiMoon aria-hidden="true" />
              <span className="tv-theme__label">Dark</span>
            </button>
          </div>
        </div>

        <a
          className="tv-header__link"
          href="https://github.com/DMNerd/tuning-visualizer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
        >
          <FaGithub />
        </a>
      </div>
    </div>
  );
}

export default React.memo(PanelHeader);
