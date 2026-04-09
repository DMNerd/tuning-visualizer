import BaseCombobox from "@/components/UI/combobox/BaseCombobox";
import clsx from "clsx";
import { useCallback } from "react";

export default function ScalePicker({
  id,
  className,
  scaleOptions = [],
  scale,
  setScale,
  "aria-labelledby": ariaLabelledby,
}) {
  const getOptionKey = useCallback(
    (opt) => `${opt.systemId ?? "sys"}-${opt.label}`,
    [],
  );
  const options = scaleOptions;
  const getOptionLabel = useCallback((opt) => opt.label, []);
  const getFilterTerms = useCallback((opt) => [opt.label, opt.systemId], []);
  const handleSelect = useCallback(
    (option) => {
      if (!option) return;
      setScale(option.label);
    },
    [setScale],
  );
  const renderOption = useCallback(
    (opt) => (
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
    ),
    [],
  );
  const renderList = useCallback(
    ({ options, listProps, renderOptionItem, virtualization }) => {
      const shouldVirtualize = virtualization?.shouldVirtualize;
      const virtualItems = shouldVirtualize
        ? virtualization.getVirtualItems()
        : [];
      const virtualPaddingTop = virtualItems[0]?.start ?? 0;
      const lastVirtualItem = virtualItems[virtualItems.length - 1];
      const virtualPaddingBottom =
        shouldVirtualize && lastVirtualItem
          ? virtualization.rowVirtualizer.getTotalSize() - lastVirtualItem.end
          : 0;

      return (
        <div className="tv-scale-picker__popover">
          <ul
            {...listProps}
            ref={virtualization?.listRef ?? listProps.ref}
            className="tv-combobox__list tv-scale-picker__list"
            aria-labelledby={ariaLabelledby}
            style={shouldVirtualize ? { gap: 0 } : undefined}
          >
            {options.length === 0 ? (
              <li
                className="tv-combobox__empty tv-scale-picker__empty"
                role="presentation"
                aria-live="polite"
              >
                No matching scales
              </li>
            ) : shouldVirtualize ? (
              <>
                {virtualPaddingTop > 0 ? (
                  <li
                    role="presentation"
                    aria-hidden="true"
                    style={{ height: virtualPaddingTop, padding: 0 }}
                  />
                ) : null}
                {virtualItems.map((item) => {
                  const option = options[item.index];
                  return renderOptionItem(option, item.index, {
                    className: "tv-scale-picker__option",
                    key: `${option.systemId}-${option.label}`,
                    optionProps: {
                      ref: virtualization.rowVirtualizer.measureElement,
                      "data-index": item.index,
                    },
                  });
                })}
                {virtualPaddingBottom > 0 ? (
                  <li
                    role="presentation"
                    aria-hidden="true"
                    style={{ height: virtualPaddingBottom, padding: 0 }}
                  />
                ) : null}
              </>
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
      );
    },
    [ariaLabelledby],
  );

  return (
    <BaseCombobox
      id={id}
      value={scale}
      onSelect={handleSelect}
      options={options}
      getOptionKey={getOptionKey}
      getOptionLabel={getOptionLabel}
      getFilterTerms={getFilterTerms}
      renderOption={renderOption}
      renderList={renderList}
      aria-labelledby={ariaLabelledby}
      className={clsx("tv-combobox", "tv-scale-picker", className)}
    />
  );
}
