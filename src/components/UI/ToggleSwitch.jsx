import clsx from "clsx";

function ToggleSwitch({
  id,
  name,
  checked,
  onChange,
  disabled = false,
  className,
  children,
}) {
  return (
    <label className={clsx("tv-check", "tv-toggle", className)} htmlFor={id}>
      <input
        id={id}
        name={name}
        className="tv-toggle__input"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="tv-toggle__switch" aria-hidden="true">
        <span className="tv-toggle__thumb" />
      </span>
      <span className="tv-toggle__label">{children}</span>
    </label>
  );
}

export default ToggleSwitch;
