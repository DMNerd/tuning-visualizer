import { useEffect, useRef } from "react";
import { useLatest } from "react-use";
import { toast } from "react-hot-toast";
import i18n from "@shared/i18n";
import { decodeRoutine } from "@features/training/model/routineCodec";
import { ROUTINE_QUERY_KEY } from "@features/training/model/routineSchema";
import { removeUrlSearchParams } from "@shared/lib/urlSearchParams";

/**
 * Detects a `?rt=...` routine link on initial mount and hands the decoded
 * routine to the caller. Writes only to local component state (via the
 * callback) and never to the theory/instrument domains, so it doesn't need
 * to coordinate with useUrlShareHydration's store-hydration gate.
 */
export function useTrainingRoutineUrlHydration({ onRoutineImported } = {}) {
  const parsedOnceRef = useRef(false);
  const onRoutineImportedRef = useLatest(onRoutineImported);

  useEffect(() => {
    if (parsedOnceRef.current) return;
    if (typeof window === "undefined") return;
    parsedOnceRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get(ROUTINE_QUERY_KEY);
    if (!token) return;

    const routine = decodeRoutine(token);
    if (routine) {
      toast.success(i18n.t("training.loadedFromLink"), {
        id: "training-routine-url-load",
      });
      onRoutineImportedRef.current?.(routine);
    } else {
      toast(i18n.t("training.invalidLink"), {
        id: "training-routine-url-load",
      });
    }

    removeUrlSearchParams([ROUTINE_QUERY_KEY]);
  }, [onRoutineImportedRef]);
}
