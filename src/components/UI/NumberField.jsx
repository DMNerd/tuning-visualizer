import clsx from "clsx";
import { useNumberField } from "@/hooks/useNumberField";

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onSubmit,
  disabled = false,
  step = 1,
  className,
  hideLabel = false,
}) {
  const { text, error, onChange, onBlur, onKeyDown, placeholder, helpText } =
    useNumberField({ value, min, max, onSubmit });
  const helpId = `${id}-help`;

  return (
    <div className={clsx("tv-field", className)}>
      {!hideLabel ? (
        <label className="tv-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={Boolean(error)}
        aria-describedby={helpId}
        aria-label={hideLabel ? label : undefined}
        placeholder={placeholder}
        disabled={disabled}
      />
      <small
        id={helpId}
        className={clsx("tv-field__help", {
          "tv-field__help--error": error,
        })}
      >
        {helpText}
      </small>
    </div>
  );
}

export default NumberField;
