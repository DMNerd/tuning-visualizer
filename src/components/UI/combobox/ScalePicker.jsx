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
        <li className={clsx("tv-combobox__option", "tv-scale-picker__option")}>
          <span className="tv-scale-picker__option-label">{opt.label}</span>
          {opt.systemId ? (
            <span className="tv-scale-picker__option-meta">
              <span className="tv-combobox__badge tv-combobox__badge--accent">
                {opt.systemId}
              </span>
            </span>
          ) : null}
        </li>
      )}
      renderList={({
        options,
        activeIndex,
        getOptionProps,
        listProps,
        commitSelection,
      }) => (
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
              options.map((option, index) => {
                const optionProps = getOptionProps(index, {
                  option,
                  onSelect: () => commitSelection(option),
                });
                const { className: optClass, ...rest } = optionProps;
                const isActive = index === activeIndex;
                const isSelected = option.label === scale;
                return (
                  <li
                    key={`${option.systemId}-${option.label}`}
                    aria-selected={isSelected}
                    {...rest}
                    className={clsx(
                      "tv-combobox__option",
                      "tv-scale-picker__option",
                      optClass,
                      {
                        "is-active": isActive,
                        "is-selected": isSelected,
                      },
                    )}
                  >
                    <span className="tv-scale-picker__option-label">
                      {option.label}
                    </span>
                    {option.systemId ? (
                      <span className="tv-scale-picker__option-meta">
                        <span className="tv-combobox__badge tv-combobox__badge--accent">
                          {option.systemId}
                        </span>
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      aria-labelledby={ariaLabelledby}
      className={clsx("tv-combobox", "tv-scale-picker", className)}
    />
  );
}
