import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import i18n from "@shared/i18n";

import { applyResolvedTuning } from "@shared/lib/applyResolvedTuning";
import { trimmedString } from "@shared/lib/strings";
import {
  parseSharePayload,
  resolveInstrumentHydrationValues,
} from "@features/share/model/shareCodec";
import {
  areShareDomainsHydrated,
  buildSharedPackPayload,
  clearUrlSearchParams,
  evaluateUrlShareNoticeState,
  findPackByReference,
  shouldApplyUrlHydration,
} from "@features/share/model/urlShareHydration";

function safeInvoke(fn, value) {
  if (typeof fn !== "function") return;
  fn(value);
}

/**
 * Hydrate app state from URL share payload one time on initial mount.
 */
export function useUrlShareHydration({ theoryDomain, instrumentDomain }) {
  const parsedOnceRef = useRef(false);
  const appliedOnceRef = useRef(false);
  const parsedPayloadRef = useRef(null);

  const hydrationReady = areShareDomainsHydrated({
    theoryHydrated: theoryDomain?.hydration?.isHydrated,
    instrumentHydrated: instrumentDomain?.instrumentState?.isHydrated,
  });

  useEffect(() => {
    if (parsedOnceRef.current) return;
    if (typeof window === "undefined") return;

    parsedOnceRef.current = true;
    const searchParams = new URLSearchParams(window.location.search);
    parsedPayloadRef.current = parseSharePayload(searchParams);

    const noticeState = evaluateUrlShareNoticeState({
      hasSearch: searchParams.toString().length > 0,
      payload: parsedPayloadRef.current,
    });
    if (noticeState === "valid") {
      toast.success(i18n.t("share.loaded"), {
        id: "quickshare-url-load",
      });
    } else if (noticeState === "invalid") {
      toast(i18n.t("share.invalid"), {
        id: "quickshare-url-load",
      });
    }
  }, []);

  useEffect(() => {
    const payload = parsedPayloadRef.current;
    if (
      !shouldApplyUrlHydration({
        parsedOnce: parsedOnceRef.current,
        appliedOnce: appliedOnceRef.current,
        hydrationReady,
        payload,
      })
    ) {
      return;
    }

    const values = resolveInstrumentHydrationValues(payload);
    if (!values) return;

    const theorySystem = theoryDomain?.system || {};
    const instrumentActions = instrumentDomain?.instrumentActions || {};
    const instrumentPresets = instrumentDomain?.presets || {};
    const instrumentCustomTuningIO = instrumentDomain?.customTunings || {};

    const applyPayload = async () => {
      applyResolvedTuning({
        setSystemId: theorySystem.setSystemId,
        setStrings: instrumentActions.setStrings,
        setTuning: instrumentActions.setTuning,
        setTuningAtomic: instrumentActions.setTuningAtomic,
        systemId: values.systemId,
        strings: values.strings,
        tuning: values.tuning,
      });
      safeInvoke(instrumentActions.setFrets, values.frets);
      safeInvoke(instrumentActions.setStringMeta, values.stringMeta);
      safeInvoke(instrumentActions.setBoardMeta, values.boardMeta);
      safeInvoke(instrumentActions.setNeckFilterMode, values.neckFilterMode);

      const presetName = trimmedString(values.presetName);
      const packPayload =
        values.packPayload && typeof values.packPayload === "object"
          ? values.packPayload
          : null;
      if (presetName) {
        const existing = findPackByReference(
          instrumentCustomTuningIO.customTunings,
          {
            packId: values.packId,
            presetName,
          },
        );

        let saveFailed = false;
        if (
          !existing &&
          packPayload &&
          typeof instrumentCustomTuningIO.saveCustomTuning === "function"
        ) {
          try {
            await instrumentCustomTuningIO.saveCustomTuning(
              buildSharedPackPayload(packPayload, presetName),
            );
          } catch {
            // The shared pack payload passed the coarse shareCodec check but
            // was rejected by the stricter tuning-pack schema — skip
            // selecting a preset name with no actual saved tuning behind
            // it, rather than leaving the UI pointing at a dangling name.
            saveFailed = true;
          }
        }

        if (!saveFailed) {
          safeInvoke(instrumentPresets.setPreset, presetName);
        }
      }

      // Non-destructive by design: custom packs are only upserted when a shared
      // pack payload is explicitly provided; nothing is cleared/replaced.
      appliedOnceRef.current = true;
      clearUrlSearchParams();
    };

    void applyPayload();
  }, [hydrationReady, instrumentDomain, theoryDomain]);
}
