import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "react-use";
import { useShallow } from "zustand/react/shallow";
import { ordinal } from "@shared/lib/ordinals";
import * as v from "valibot";
import {
  buildTuningPack,
  downloadJsonFile,
  ensurePackHasId,
  normalizePackName,
  parseTuningPack,
  removePackByIdentifier,
  stripVersionField,
  TuningPackArraySchema,
} from "@features/export";
import { withToastPromise } from "@shared/lib/toast";
import { upgradeLegacyPack } from "@features/instrument/model/legacyPackUpgrade";
import {
  ensureUniqueName,
  ensureUniquePackId,
  getTakenIds,
  getTakenNames,
} from "@features/instrument/model/packNaming";
import {
  useInstrumentWorkflowStore,
  selectInstrumentWorkflowActions,
  selectWorkflowCustomTunings,
} from "@features/instrument/store/useInstrumentWorkflowStore";
import { sanitizeBoardMetaForModeStorage } from "@domain/presets/neckFilterModes";

export function useTuningIO({ systemId, strings, TUNINGS }) {
  const customTunings = useInstrumentWorkflowStore(selectWorkflowCustomTunings);
  const { setCustomTunings, updateCustomTunings } = useInstrumentWorkflowStore(
    useShallow(selectInstrumentWorkflowActions),
  );
  const upgradeRef = useRef(false);

  useEffect(() => {
    if (upgradeRef.current) return;

    if (!Array.isArray(customTunings) || !customTunings.length) {
      upgradeRef.current = true;
      return;
    }

    let changed = false;
    const upgraded = customTunings.map((pack) => {
      const upgradedPack = upgradeLegacyPack(pack);
      const withId = ensurePackHasId(upgradedPack);
      if (withId !== pack) {
        changed = true;
      }
      return withId;
    });

    upgradeRef.current = true;
    if (changed) {
      updateCustomTunings(() => upgraded);
    }
  }, [customTunings, updateCustomTunings]);

  const latestCustomTuningsRef = useLatest(customTunings);

  const getExistingCustomTunings = useCallback(() => {
    const existing = latestCustomTuningsRef.current;
    return Array.isArray(existing) ? existing : [];
  }, [latestCustomTuningsRef]);

  const parsePack = useCallback(parseTuningPack, []);

  const getCurrentTuningPack = useCallback(
    (tuning, stringMeta = null, boardMeta = null) => {
      const sys = TUNINGS[systemId];
      const cleanStringMeta = Array.isArray(stringMeta) ? stringMeta : null;
      const cleanBoardMeta =
        boardMeta && typeof boardMeta === "object" && !Array.isArray(boardMeta)
          ? sanitizeBoardMetaForModeStorage(boardMeta)
          : null;

      const pack = buildTuningPack({
        systemDivisions: sys.divisions,
        systemId,
        stringsCount: strings,
        tuning,
        stringMeta: cleanStringMeta ?? undefined,
      });

      const meta = { ...(pack.meta || {}) };
      if (cleanStringMeta && cleanStringMeta.length) {
        meta.stringMeta = cleanStringMeta;
      }
      if (cleanBoardMeta && Object.keys(cleanBoardMeta).length) {
        meta.board = { ...cleanBoardMeta };
      }

      const hasMeta = Object.keys(meta).length > 0;

      return {
        ...pack,
        ...(hasMeta ? { meta } : { meta: undefined }),
      };
    },
    [systemId, strings, TUNINGS],
  );

  const getAllCustomTunings = getExistingCustomTunings;

  const saveCustomTuning = useCallback(
    (pack, options = {}) => {
      const parsed = ensurePackHasId(parsePack(pack));

      const desiredName = normalizePackName(parsed?.name);
      const replaceName = normalizePackName(options?.replaceName);

      const existing = getExistingCustomTunings().map(ensurePackHasId);
      const takenNames = getTakenNames(existing, { exclude: replaceName });

      const finalName = ensureUniqueName(desiredName, takenNames);
      const nextPack = ensurePackHasId({ ...parsed, name: finalName });

      const filtered = existing.filter((item) => {
        const itemName = normalizePackName(item?.name);
        if (replaceName && itemName === replaceName) return false;
        return itemName !== finalName;
      });

      const nextTunings = [...filtered, nextPack];
      updateCustomTunings(() => nextTunings);

      return nextPack;
    },
    [getExistingCustomTunings, parsePack, updateCustomTunings],
  );

  const deleteCustomTuning = useCallback(
    (identifier) => {
      if (!identifier) return;
      const existing = getExistingCustomTunings();
      const filtered = removePackByIdentifier(existing, identifier);
      updateCustomTunings(() => filtered);
    },
    [getExistingCustomTunings, updateCustomTunings],
  );

  const onImportTunings = useCallback(
    (packsRaw, filenames = []) => {
      const sanitizedInput = Array.isArray(packsRaw)
        ? packsRaw.map(stripVersionField)
        : packsRaw;

      const res = v.safeParse(TuningPackArraySchema, sanitizedInput);
      if (!res.success) {
        const msg =
          res.issues?.map((i) => i.message).join("\n") ||
          "Selected file is not a valid tuning pack.";
        throw new Error(msg);
      }

      const parsed = res.output.map((pack) => parsePack(pack));

      const existing = getExistingCustomTunings();
      const takenNames = getTakenNames(existing);
      const takenIds = getTakenIds(existing);

      const newTunings = parsed.map((p, i) => {
        const candidate =
          (typeof p.name === "string" ? p.name : "") ||
          (typeof filenames[i] === "string" ? filenames[i] : "") ||
          `Imported ${ordinal(i + 1)}`;
        const label = candidate.trim() || `Imported ${ordinal(i + 1)}`;
        const uniqueName = ensureUniqueName(label, takenNames);
        const { system, ...rest } = p;
        const cleanSystem = { edo: system.edo };
        const withId = ensurePackHasId({
          ...rest,
          system: cleanSystem,
          name: uniqueName,
        });
        return ensureUniquePackId(withId, takenIds);
      });

      const nextTunings = [...existing, ...newTunings];
      updateCustomTunings(() => nextTunings);
    },
    [getExistingCustomTunings, parsePack, updateCustomTunings],
  );

  const importFromJson = useCallback(
    async (json, filenames = []) => {
      return withToastPromise(
        () => onImportTunings(json, filenames),
        {
          loading: "Importing tunings…",
          success: "Tunings imported.",
          error: (e) => e?.message || "Import failed.",
        },
        "import-tunings",
      );
    },
    [onImportTunings],
  );

  const exportCurrent = useCallback(
    (tuning, stringMeta, boardMeta) => {
      return withToastPromise(
        () => {
          const pack = getCurrentTuningPack(tuning, stringMeta, boardMeta);
          if (!pack)
            throw new Error("Nothing to export for the current tuning.");
          downloadJsonFile(pack, "current-tuning.json");
        },
        {
          loading: "Preparing current tuning…",
          success: "Current tuning exported.",
          error: (e) => e?.message || "Export failed.",
        },
        "export-current-tuning",
      );
    },
    [getCurrentTuningPack],
  );

  const exportAll = useCallback(() => {
    return withToastPromise(
      () => {
        const packs = getAllCustomTunings() || [];
        if (!packs.length) throw new Error("No custom tunings to export.");
        downloadJsonFile(packs, "custom-tunings.json");
      },
      {
        loading: "Collecting custom tunings…",
        success: "Custom tunings exported.",
        error: (e) => e?.message || "Export failed.",
      },
      "export-all-tunings",
    );
  }, [getAllCustomTunings]);

  return {
    getCurrentTuningPack,
    getAllCustomTunings,
    saveCustomTuning,
    deleteCustomTuning,
    onImportTunings,
    customTunings: customTunings || [],
    clearCustomTunings: () => setCustomTunings([]),
    importFromJson,
    exportCurrent,
    exportAll,
  };
}
