import { useEffect, useRef } from "react";
import { useLatest } from "react-use";
import { toast } from "react-hot-toast";
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
      toast.success("Routine loaded from link. Review and save to keep it.", {
        id: "training-routine-url-load",
      });
      onRoutineImportedRef.current?.(routine);
    } else {
      toast("Routine link detected, but no valid routine was found.", {
        id: "training-routine-url-load",
      });
    }

    removeUrlSearchParams([ROUTINE_QUERY_KEY]);
  }, [onRoutineImportedRef]);
}
