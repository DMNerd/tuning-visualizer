import BaseCombobox from "@/components/UI/combobox/BaseCombobox";
import clsx from "clsx";

export default function ScalePicker({
  id,
  className,
  scaleOptions = [],
  scale,
  setScale,
  "aria-labelledby": ariaLabelledby,
}) {
  return (
    <BaseCombobox
      id={id}
      value={scale}
      onSelect={(option) => {
        if (!option) return;
        setScale(option.label);
      }}
      options={scaleOptions}
      getOptionKey={(opt) => `${opt.systemId ?? "sys"}-${opt.label}`}
      getOptionLabel={(opt) => opt.label}
      getFilterTerms={(opt) => [opt.label, opt.systemId]}
      renderOption={(opt) => (
        <>
          <span className="tv-scale-picker__option-label">{opt.label}</span>
          {opt.systemId ? (
            <span className="tv-scale-picker__option-meta">
              <span className="tv-combobox__badge tv-combobox__badge--accent">
                {opt.systemId}
              </span>
            </span>
          ) : null}
        </>
      )}
      renderList={({ options, listProps, renderOptionItem }) => (
        <div className="tv-scale-picker__popover">
          <ul
            {...listProps}
            className="tv-combobox__list tv-scale-picker__list"
            aria-labelledby={ariaLabelledby}
          >
            {options.length === 0 ? (
              <li
                className="tv-combobox__empty tv-scale-picker__empty"
                role="presentation"
                aria-live="polite"
              >
                No matching scales
              </li>
            ) : (
              options.map((option, index) =>
                renderOptionItem(option, index, {
                  className: "tv-scale-picker__option",
                  key: `${option.systemId}-${option.label}`,
                }),
              )
            )}
          </ul>
        </div>
      )}
      aria-labelledby={ariaLabelledby}
      className={clsx("tv-combobox", "tv-scale-picker", className)}
    />
  );
}
