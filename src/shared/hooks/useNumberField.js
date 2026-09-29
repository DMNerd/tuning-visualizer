import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@shared/i18n";
import { clamp } from "@shared/lib/math";

export function commitNumberField({
  rawOverride,
  textValue,
  min,
  max,
  setError,
  setText,
  onSubmit,
}) {
  const raw =
    typeof rawOverride === "number" ? rawOverride : parseInt(textValue, 10);

  if (!Number.isFinite(raw)) {
    setError(i18n.t("numberField.notANumber", { min, max }));
    return false;
  }

  const val = clamp(raw, min, max);
  if (val !== raw) {
    setError(i18n.t("numberField.clamped", { min, max, value: val }));
  } else {
    setError("");
  }
  onSubmit(val);
  setText(String(val));
  return true;
}

export function useNumberField({ value, min, max, onSubmit }) {
  const { t } = useTranslation();
  const [text, setText] = useState(String(value));
  const [error, setError] = useState("");

  useEffect(() => setText(String(value)), [value]);

  const commit = useCallback(
    (rawOverride) =>
      commitNumberField({
        rawOverride,
        textValue: text,
        min,
        max,
        setError,
        setText,
        onSubmit,
      }),
    [text, min, max, onSubmit],
  );

  const revert = useCallback(() => {
    setText(String(value));
  }, [value]);

  const onBlur = useCallback(() => {
    if (!commit()) revert();
  }, [commit, revert]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") {
        revert();
        setError("");
        e.currentTarget.blur();
      }
    },
    [commit, revert],
  );

  const onChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  return {
    text,
    error,
    onChange,
    onBlur,
    onKeyDown,
    placeholder: `${min}–${max}`,
    helpText: error || t("numberField.allowedRange", { min, max }),
  };
}
