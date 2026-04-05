import { useCallback, useEffect, useState } from "react";
import { clamp } from "@/utils/math";

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
    setError(`Please enter a number between ${min} and ${max}.`);
    return false;
  }

  const val = clamp(raw, min, max);
  if (val !== raw) {
    setError(`Allowed range is ${min}–${max}. Adjusted to ${val}.`);
  } else {
    setError("");
  }
  onSubmit(val);
  setText(String(val));
  return true;
}

export function useNumberField({ value, min, max, onSubmit }) {
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
    helpText: error || `Allowed range: ${min}–${max}`,
  };
}
