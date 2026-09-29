import BaseCombobox from "@shared/ui/BaseCombobox";
import clsx from "clsx";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function ScalePicker({
  id,
  className,
  scaleOptions = [],
  scale,
  setScale,
  "aria-labelledby": ariaLabelledby,
}) {
  const { t } = useTranslation();
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
      listClassName="tv-scale-picker__list"
      optionClassName="tv-scale-picker__option"
      emptyText={t("theory.noMatchingScales")}
      aria-labelledby={ariaLabelledby}
      className={clsx("tv-scale-picker", className)}
    />
  );
}
