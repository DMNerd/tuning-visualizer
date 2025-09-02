export default function PanelHeader({ theme, setTheme, lefty, setLefty }) {
  return (
    <div className="panel-header">
      <h1>TunningViz</h1>
      <div className="toggles">
        <label className="switch" htmlFor="darkMode">
          <input
            id="darkMode"
            name="darkMode"
            type="checkbox"
            checked={theme === "dark"}
            onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
          />
          Dark Mode
        </label>
        <label className="switch" htmlFor="lefty">
          <input
            id="lefty"
            name="lefty"
            type="checkbox"
            checked={lefty}
            onChange={(e) => setLefty(e.target.checked)}
          />
          Lefty
        </label>
      </div>
    </div>
  );
}
