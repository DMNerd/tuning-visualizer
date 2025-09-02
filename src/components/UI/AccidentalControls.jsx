import { FaGithub } from "react-icons/fa";

export default function PanelHeader({ theme, setTheme, lefty, setLefty }) {
  return (
    <div className="panel-header">
      <h1 className="app-title">TunningViz</h1>

      <div className="header-right">
        <div className="toggles">
          <label className="switch" htmlFor="darkMode">
            <input
              id="darkMode"
              name="darkMode"
              type="checkbox"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            />
            <span>Dark Mode</span>
          </label>

          <label className="switch" htmlFor="lefty">
            <input
              id="lefty"
              name="lefty"
              type="checkbox"
              checked={lefty}
              onChange={(e) => setLefty(e.target.checked)}
            />
            <span>Lefty</span>
          </label>
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
