import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

import {
  parseSharePayload,
  resolveInstrumentHydrationValues,
} from "@/lib/url/shareCodec";

function hasAnyValues(payload) {
  return !!(
    payload &&
    payload.values &&
    typeof payload.values === "object" &&
    Object.keys(payload.values).length > 0
  );
}

function safeInvoke(fn, value) {
  if (typeof fn !== "function") return;
  fn(value);
}

function findPackByReference(customTunings, { packId, presetName }) {
  if (!Array.isArray(customTunings) || !customTunings.length) return null;
  const normalizedId =
    typeof packId === "string" && packId.trim() ? packId.trim() : null;
  const normalizedName =
    typeof presetName === "string" && presetName.trim()
      ? presetName.trim()
      : null;
  return (
    customTunings.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const id =
        typeof entry?.meta?.id === "string" ? entry.meta.id.trim() : null;
      const name = typeof entry?.name === "string" ? entry.name.trim() : null;
      if (normalizedId && id && id === normalizedId) return true;
      if (normalizedName && name && name === normalizedName) return true;
      return false;
    }) || null
  );
}

export function areShareDomainsHydrated({
  theoryHydrated = false,
  instrumentHydrated = false,
} = {}) {
  // URL-share hydration intentionally gates on theory + instrument only.
  // Display/metronome hydration is generic app bootstrap and not share-critical.
  return Boolean(theoryHydrated) && Boolean(instrumentHydrated);
}

export function shouldApplyUrlHydration({
  parsedOnce = false,
  appliedOnce = false,
  hydrationReady = false,
  payload = null,
} = {}) {
  return (
    Boolean(parsedOnce) &&
    !appliedOnce &&
    Boolean(hydrationReady) &&
    hasAnyValues(payload)
  );
}

export function evaluateUrlShareNoticeState({
  hasSearch = false,
  payload = null,
} = {}) {
  if (!hasSearch) return "none";
  return hasAnyValues(payload) ? "valid" : "invalid";
}

export function clearUrlSearchParams() {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const current = new URL(window.location.href);
  if (!current.search) return;
  current.search = "";
  window.history.replaceState(window.history.state, "", current.toString());
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
      toast.success("Quickshare loaded from URL.", {
        id: "quickshare-url-load",
      });
    } else if (noticeState === "invalid") {
      toast("Quickshare URL detected, but no valid payload was found.", {
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
      safeInvoke(theorySystem.setSystemId, values.systemId);
      safeInvoke(instrumentActions.setStrings, values.strings);
      safeInvoke(instrumentActions.setFrets, values.frets);
      safeInvoke(instrumentActions.setTuning, values.tuning);
      safeInvoke(instrumentActions.setStringMeta, values.stringMeta);
      safeInvoke(instrumentActions.setBoardMeta, values.boardMeta);
      safeInvoke(instrumentActions.setNeckFilterMode, values.neckFilterMode);

      const presetName =
        typeof values.presetName === "string" ? values.presetName.trim() : "";
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

        if (
          !existing &&
          packPayload &&
          typeof instrumentCustomTuningIO.saveCustomTuning === "function"
        ) {
          const payload = {
            ...packPayload,
            name:
              typeof packPayload?.name === "string" && packPayload.name.trim()
                ? packPayload.name.trim()
                : presetName,
            meta: {
              ...(packPayload?.meta && typeof packPayload.meta === "object"
                ? packPayload.meta
                : {}),
              sharedViaUrl: true,
            },
          };
          try {
            await instrumentCustomTuningIO.saveCustomTuning(payload);
          } catch {
            // Non-fatal: still attempt preset selection below.
          }
        }

        safeInvoke(instrumentPresets.setPreset, presetName);
      }

      // Non-destructive by design: custom packs are only upserted when a shared
      // pack payload is explicitly provided; nothing is cleared/replaced.
      appliedOnceRef.current = true;
      clearUrlSearchParams();
    };

    void applyPayload();
  }, [hydrationReady, instrumentDomain, theoryDomain]);
}
