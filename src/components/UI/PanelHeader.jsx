import React from "react";
import clsx from "clsx";
import { FaGithub } from "react-icons/fa";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

/**
 * Keeps original layout + title ("TunningViz") and GitHub link.
 * Replaces the Dark Mode checkbox with a segmented Auto/Light/Dark control.
 * Lefty toggle was moved to Display section, so it's not rendered here anymore.
 */
function PanelHeader({ theme, setTheme /* lefty, setLefty (unused) */ }) {
  const setAuto = () => setTheme("auto");
  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");

  const isAuto = theme === "auto";
  const isLight = theme === "light";
  const isDark = theme === "dark";

  return (
    <div className="panel-header">
      <h1 className="app-title">TunningViz</h1>

      <div className="header-right">
        <div className="toggles">
          {/* Theme segmented control (Auto / Light / Dark) */}
          <div className="theme-segment" role="group" aria-label="Theme mode">
            <button
              type="button"
              className={clsx("seg-btn", { active: isAuto })}
              aria-pressed={isAuto}
              onClick={setAuto}
              title="Auto theme (follow system)"
            >
              <FiMonitor aria-hidden="true" />
              <span className="seg-label">Auto</span>
            </button>
            <button
              type="button"
              className={clsx("seg-btn", { active: isLight })}
              aria-pressed={isLight}
              onClick={setLight}
              title="Light theme"
            >
              <FiSun aria-hidden="true" />
              <span className="seg-label">Light</span>
            </button>
            <button
              type="button"
              className={clsx("seg-btn", { active: isDark })}
              aria-pressed={isDark}
              onClick={setDark}
              title="Dark theme"
            >
              <FiMoon aria-hidden="true" />
              <span className="seg-label">Dark</span>
            </button>
          </div>
        </div>

        <a
          className="gh-link"
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
