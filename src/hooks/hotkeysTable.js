import { clamp } from "@/utils/math";
import { DOT_SIZE_DEFAULT } from "@/lib/config/appDefaults";

/** @typedef {import("@/hooks/hotkeys.types").HotkeysLiveRef} HotkeysLiveRef */

/** @param {HotkeysLiveRef} liveRef */
export function buildShortcutTableFromRefs(liveRef) {
  const display = [
    {
      combo: ["shift+/", "ctrl+/", "F1"],
      handler: () => {
        const live = liveRef.current || {};
        live.onShowCheatsheet?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.onShowCheatsheet === "function";
      },
    },
    {
      combo: "f",
      handler: () => {
        const live = liveRef.current || {};
        live.toggleFs?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.toggleFs === "function";
      },
    },
    {
      combo: "l",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          const values = live.labelValues || [];
          if (!values.length) return;
          const ix = values.findIndex((v) => v === d.show);
          d.show = values[(ix + 1) % values.length];
        });
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.setDisplayPrefs === "function";
      },
    },
    {
      combo: "o",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.showOpen = !d.showOpen;
        });
      },
    },
    {
      combo: "n",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.showFretNums = !d.showFretNums;
        });
      },
    },
    {
      combo: "d",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.colorByDegree = !d.colorByDegree;
        });
      },
    },
    {
      combo: "a",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.accidental = d.accidental === "sharp" ? "flat" : "sharp";
        });
      },
    },
    {
      combo: "g",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.lefty = !d.lefty;
        });
      },
    },
    {
      combo: ",",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.dotSize = clamp(
            (d.dotSize ?? DOT_SIZE_DEFAULT) - 1,
            live.minDot,
            live.maxDot,
          );
        });
      },
    },
    {
      combo: ".",
      handler: () => {
        const live = liveRef.current || {};
        live.setDisplayPrefs?.((d) => {
          d.dotSize = clamp(
            (d.dotSize ?? DOT_SIZE_DEFAULT) + 1,
            live.minDot,
            live.maxDot,
          );
        });
      },
    },
  ];

  const instrument = [
    {
      combo: "c",
      handler: () => {
        const live = liveRef.current || {};
        live.setShowChord?.();
      },
    },
    {
      combo: "h",
      handler: () => {
        const live = liveRef.current || {};
        live.setHideNonChord?.();
      },
    },
    {
      combo: "[",
      handler: () => {
        const live = liveRef.current || {};
        live.handleStringsChange?.(
          clamp((live.strings ?? 0) - 1, live.minStrings, live.maxStrings),
        );
      },
    },
    {
      combo: "]",
      handler: () => {
        const live = liveRef.current || {};
        live.handleStringsChange?.(
          clamp((live.strings ?? 0) + 1, live.minStrings, live.maxStrings),
        );
      },
    },
    {
      combo: "-",
      handler: () => {
        const live = liveRef.current || {};
        live.setFrets?.(
          clamp((live.frets ?? 0) - 1, live.minFrets, live.maxFrets),
        );
      },
    },
    {
      combo: "=",
      handler: () => {
        const live = liveRef.current || {};
        live.setFrets?.(
          clamp((live.frets ?? 0) + 1, live.minFrets, live.maxFrets),
        );
      },
    },
  ];

  const practice = [
    {
      combo: "r",
      handler: () => {
        const live = liveRef.current || {};
        if (
          typeof live.practiceActions?.randomizeScaleFromHotkey === "function"
        ) {
          live.practiceActions.randomizeScaleFromHotkey();
          return;
        }
        live.onRandomizeScale?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return (
          typeof live.practiceActions?.randomizeScaleFromHotkey ===
            "function" || typeof live.onRandomizeScale === "function"
        );
      },
    },
    {
      combo: ["m", "space"],
      handler: () => {
        const live = liveRef.current || {};
        live.practiceActions?.toggleMetronome?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.practiceActions?.toggleMetronome === "function";
      },
    },
    {
      combo: ["alt+[", "arrowdown"],
      handler: () => {
        const live = liveRef.current || {};
        live.practiceActions?.bpmDown?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.practiceActions?.bpmDown === "function";
      },
    },
    {
      combo: ["alt+]", "arrowup"],
      handler: () => {
        const live = liveRef.current || {};
        live.practiceActions?.bpmUp?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.practiceActions?.bpmUp === "function";
      },
    },
    {
      combo: ["t", "enter"],
      handler: () => {
        const live = liveRef.current || {};
        live.practiceActions?.tapTempo?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.practiceActions?.tapTempo === "function";
      },
    },
  ];

  const tuningPacks = [
    {
      combo: ["ctrl+n", "meta+n"],
      handler: () => {
        const live = liveRef.current || {};
        live.onCreateCustomPack?.();
      },
      when: () => {
        const live = liveRef.current || {};
        return typeof live.onCreateCustomPack === "function";
      },
    },
  ];

  return [...display, ...instrument, ...practice, ...tuningPacks];
}
