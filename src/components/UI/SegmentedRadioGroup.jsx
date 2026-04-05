import clsx from "clsx";
import React from "react";

function SegmentedRadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  className,
  labelClassName = "tv-field__label",
}) {
  const groupLabelId = React.useId();
  const idPrefix = React.useId();
  const optionCount = Array.isArray(options) ? options.length : 0;

  return (
    <div className={clsx("tv-field", className)}>
      <span className={labelClassName} id={groupLabelId}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={groupLabelId}
        className={clsx("tv-binary-toggle", {
          "tv-binary-toggle--ternary": optionCount === 3,
        })}
      >
        {(options ?? []).map((opt, idx) => {
          const optionId = `${idPrefix}-${idx}`;
          return (
            <label
              className="tv-binary-toggle__option"
              htmlFor={optionId}
              key={opt.value}
            >
              <input
                className="tv-binary-toggle__input"
                id={optionId}
                name={name}
                type="radio"
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={opt.disabled}
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
