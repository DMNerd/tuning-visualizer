import { useCallback, useMemo } from "react";
import { useKey } from "react-use";
import { clamp } from "@/utils/math";
import {
  FRETS_MAX,
  FRETS_MIN,
  STR_MAX,
  STR_MIN,
  DOT_SIZE_DEFAULT,
  DOT_SIZE_MAX,
  DOT_SIZE_MIN,
} from "@/lib/config/appDefaults";

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const editable = el.getAttribute?.("contenteditable") === "true";
  return editable || tag === "input" || tag === "textarea" || tag === "select";
};

const KEY_CODE_ALIASES = {
  "/": "slash",
  "[": "bracketleft",
  "]": "bracketright",
  "-": "minus",
  "=": "equal",
  ",": "comma",
  ".": "period",
};

const normalizeComboKey = (key) => {
  if (!key) return "";
  const lower = key.toLowerCase();
  if (lower === "space" || lower === "spacebar") return "space";
  if (lower === "enter" || lower === "return") return "enter";
  if (lower === "escape" || lower === "esc") return "escape";
  return lower;
};

const normalizeEventKey = (key) => {
  if (!key) return "";
  const lower = key.toLowerCase();
  if (lower === " ") return "space";
  if (lower === "spacebar") return "space";
  if (lower === "esc") return "escape";
  return lower;
};

const matchesModifiers = (expected, event) =>
  event.altKey === expected.altKey &&
  event.ctrlKey === expected.ctrlKey &&
  event.metaKey === expected.metaKey &&
  event.shiftKey === expected.shiftKey;

const matchesKey = (keyPart, event) => {
  if (!keyPart) return false;
  const normalizedPart = normalizeComboKey(keyPart);
  const eventKey = normalizeEventKey(event.key);

  if (normalizedPart === eventKey) return true;
  if (normalizedPart.length === 1 && eventKey === normalizedPart) return true;
  if (normalizedPart === "space" && eventKey === "space") return true;
  if (normalizedPart === "/" && (eventKey === "/" || eventKey === "?"))
    return true;

  const code = KEY_CODE_ALIASES[normalizedPart];
  if (code && event.code?.toLowerCase() === code) {
    return true;
  }

  return false;
};

const parseCombo = (combo) => {
  if (typeof combo !== "string") return null;
  const parts = combo
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const modifiers = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };
  let keyPart = "";

  parts.forEach((part) => {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control" || lower === "cmdorctrl") {
      modifiers.ctrlKey = true;
    } else if (lower === "meta" || lower === "cmd" || lower === "command") {
      modifiers.metaKey = true;
    } else if (lower === "alt" || lower === "option") {
      modifiers.altKey = true;
    } else if (lower === "shift") {
      modifiers.shiftKey = true;
    } else {
      keyPart = part;
    }
  });

  if (!keyPart && parts.length) {
    keyPart = parts[parts.length - 1];
  }

  return { keyPart, modifiers };
};

const createKeyPredicate = (keyFilter) => {
  if (typeof keyFilter === "function") {
    return (event) => !isTypingTarget(event.target) && keyFilter(event);
  }

  const combos = Array.isArray(keyFilter) ? keyFilter : [keyFilter];
  const predicates = combos
    .map((combo) => {
      const parsed = parseCombo(combo);
      if (!parsed) return null;
      return (event) => {
        if (isTypingTarget(event.target)) return false;
        if (!matchesModifiers(parsed.modifiers, event)) return false;
        return matchesKey(parsed.keyPart, event);
      };
    })
    .filter(Boolean);

  if (!predicates.length) {
    return () => false;
  }

  return (event) => predicates.some((predicate) => predicate(event));
};

const useShortcut = (keyFilter, handler) => {
  const predicate = useMemo(() => createKeyPredicate(keyFilter), [keyFilter]);

  const runHandler = useCallback(
    (event) => {
      if (typeof handler !== "function") return;
      event.preventDefault();
      handler(event);
    },
    [handler],
  );

  useKey(predicate, runHandler, undefined, [predicate, runHandler]);
};

export function useHotkeys(options) {
  const {
    toggleFs,
    setDisplayPrefs,
    setFrets,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    onShowCheatsheet,
    minStrings = STR_MIN,
    maxStrings = STR_MAX,
    minFrets = FRETS_MIN,
    maxFrets = FRETS_MAX,
    minDot = DOT_SIZE_MIN,
    maxDot = DOT_SIZE_MAX,
    onRandomizeScale,
    onCreateCustomPack,
  } = options;

  const labelValues = options.labelValues || options.LABEL_VALUES || [];

  // Cheatsheet
  useShortcut(["shift+/", "ctrl+/", "F1"], () => {
    if (typeof onShowCheatsheet === "function") onShowCheatsheet();
  });

  // TunningIO
  useShortcut(["ctrl+n", "meta+n"], () => {
    if (typeof onCreateCustomPack === "function") {
      onCreateCustomPack();
    }
  });

  // Fullscreen
  useShortcut("f", () => {
    if (typeof toggleFs === "function") toggleFs();
  });

  // Labels cycle
  useShortcut("l", () => {
    if (!setDisplayPrefs) return;
    setDisplayPrefs((d) => {
      if (!labelValues.length) return;
      const ix = labelValues.findIndex((v) => v === d.show);
      d.show = labelValues[(ix + 1) % labelValues.length];
    });
  });

  // Toggles
  useShortcut("o", () =>
    setDisplayPrefs?.((d) => {
      d.showOpen = !d.showOpen;
    }),
  );
  useShortcut("n", () =>
    setDisplayPrefs?.((d) => {
      d.showFretNums = !d.showFretNums;
    }),
  );
  useShortcut("d", () =>
    setDisplayPrefs?.((d) => {
      d.colorByDegree = !d.colorByDegree;
    }),
  );
  useShortcut("a", () =>
    setDisplayPrefs?.((d) => {
      d.accidental = d.accidental === "sharp" ? "flat" : "sharp";
    }),
  );
  useShortcut("g", () =>
    setDisplayPrefs?.((d) => {
      d.lefty = !d.lefty;
    }),
  );

  // Chord overlay
  useShortcut("c", () => setShowChord?.());
  useShortcut("h", () => setHideNonChord?.());

  // Strings +/-
  useShortcut("[", () =>
    handleStringsChange?.(clamp((strings ?? 0) - 1, minStrings, maxStrings)),
  );
  useShortcut("]", () =>
    handleStringsChange?.(clamp((strings ?? 0) + 1, minStrings, maxStrings)),
  );

  // Frets +/-
  useShortcut("-", () =>
    setFrets?.(clamp((frets ?? 0) - 1, minFrets, maxFrets)),
  );
  useShortcut("=", () =>
    setFrets?.(clamp((frets ?? 0) + 1, minFrets, maxFrets)),
  );

  // Dot size +/-
  useShortcut(",", () =>
    setDisplayPrefs?.((d) => {
      d.dotSize = clamp((d.dotSize ?? DOT_SIZE_DEFAULT) - 1, minDot, maxDot);
    }),
  );
  useShortcut(".", () =>
    setDisplayPrefs?.((d) => {
      d.dotSize = clamp((d.dotSize ?? DOT_SIZE_DEFAULT) + 1, minDot, maxDot);
    }),
  );

  // Randomize scale
  useShortcut("r", () => {
    if (typeof options.onRandomizeScale === "function") {
      onRandomizeScale();
    }
  });
}
