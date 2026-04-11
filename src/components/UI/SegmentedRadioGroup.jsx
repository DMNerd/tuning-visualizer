import clsx from "clsx";
import { useId } from "react";

function SegmentedRadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  className,
  labelClassName = "tv-field__label",
}) {
  const groupLabelId = useId();
  const idPrefix = useId();
  const optionCount = Array.isArray(options) ? options.length : 0;

  return (
    <div className={clsx("tv-field", className)}>
      <span className={labelClassName} id={groupLabelId}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={groupLabelId}
        className={clsx("tv-binary-toggle", {
          "tv-binary-toggle--ternary": optionCount === 3,
        })}
      >
        {(options ?? []).map((opt, idx) => {
          const optionId = `${idPrefix}-${idx}`;
          const isDisabled = Boolean(opt.disabled);
          return (
            <label
              className={clsx("tv-binary-toggle__option", {
                "tv-binary-toggle__option--disabled": isDisabled,
              })}
              htmlFor={optionId}
              key={opt.value}
              aria-disabled={isDisabled ? "true" : undefined}
            >
              <input
                className="tv-binary-toggle__input"
                id={optionId}
                name={name}
                type="radio"
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={isDisabled}
              />
              <span className="tv-binary-toggle__label">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SegmentedRadioGroup;
