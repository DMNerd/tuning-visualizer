import { evaluateShareUrlSize } from "@features/share/model/shareLimits";
import { encodeRoutine } from "@features/training/model/routineCodec";
import { ROUTINE_QUERY_KEY } from "@features/training/model/routineSchema";
import type { Routine } from "@features/training/model/routine";

export function buildRoutineShareModel({
  routine,
  locationLike,
}: {
  routine: Routine | null;
  locationLike?: { origin: string; pathname: string; search?: string } | null;
}) {
  if (!routine || !locationLike) {
    return {
      canonicalUrl: "",
      presentableUrl: "",
      sizeEvaluation: evaluateShareUrlSize(""),
    };
  }

  // Preserve any other existing query params (e.g. an instrument Quickshare
  // payload) instead of wiping the query string — a routine link must
  // compose alongside instrument share in one URL.
  const params = new URLSearchParams(locationLike.search || "");
  params.set(ROUTINE_QUERY_KEY, encodeRoutine(routine));
  const base = `${locationLike.origin}${locationLike.pathname}`;
  const canonicalUrl = `${base}?${params.toString()}`;

  return {
    canonicalUrl,
    presentableUrl: canonicalUrl,
    sizeEvaluation: evaluateShareUrlSize(canonicalUrl),
  };
}
