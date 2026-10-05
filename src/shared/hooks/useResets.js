import { useCallback } from "react";
import {
  STR_FACTORY,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  SYSTEM_DEFAULT,
  getFactoryFrets,
} from "@shared/config/appDefaults";
import { useLatest } from "@shared/hooks/stateHooks";
import i18n from "@shared/i18n";
import { resetAllStores } from "@shared/lib/resetAllStores";
import { resetMusicalStateFromRefs } from "@features/theory/hooks/resetMusicalState";

// `deps` carries the store setters/resetters plus `system`, `toast` and
// `confirm`; the resets read them through a ref so they stay stable.
export function useResets(deps) {
  const refs = useLatest({ ...deps, divisions: deps.system.divisions });

  const resetInstrumentState = useCallback(
    (divisions) => {
      const edo = Number.isFinite(divisions)
        ? divisions
        : refs.current.divisions;
      const factoryFrets = getFactoryFrets(edo);
      refs.current.resetInstrumentPrefs(STR_FACTORY, factoryFrets);
      refs.current.setCapoFret(CAPO_DEFAULT);
      refs.current.setStringMeta(null);
      refs.current.setBoardMeta?.(null);
    },
    [refs],
  );

  const resetDisplayState = useCallback(() => {
    if (typeof refs.current.resetDisplayPrefs === "function") {
      refs.current.resetDisplayPrefs();
      return;
    }
    refs.current.setDisplayPrefs?.(DISPLAY_DEFAULTS);
  }, [refs]);

  const resetSystem = useCallback(() => {
    refs.current.setSystemId?.(SYSTEM_DEFAULT);
  }, [refs]);

  const resetMusicalState = useCallback(() => {
    resetMusicalStateFromRefs(refs.current);
  }, [refs]);

  const resetAll = useCallback(
    async ({ confirm: shouldConfirm = true } = {}) => {
      if (shouldConfirm && typeof refs.current.confirm === "function") {
        const ok = await refs.current.confirm({
          title: i18n.t("resets.resetAllTitle"),
          message: i18n.t("resets.resetAllMessage"),
          confirmText: i18n.t("resets.resetAllConfirm"),
          cancelText: i18n.t("common.cancel"),
          toastId: "confirm-reset",
        });
        if (!ok) return;
      }

      refs.current.stopMetronome?.();
      refs.current.resetPracticeCounters?.();
      resetAllStores();

      refs.current.toast?.success?.(i18n.t("resets.resetAllDone"));
    },
    [refs],
  );

  return {
    resetInstrumentFactory: resetInstrumentState,
    resetDisplay: resetDisplayState,
    resetSystem,
    resetMusicalState,
    resetAll,
  };
}
