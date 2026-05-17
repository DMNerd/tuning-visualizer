import { serializeShareState } from "@features/share/model/shareState";
import { buildSharePayload, serializeSharePayload } from "@features/share/model/shareCodec";
import { evaluateShareUrlSize } from "@features/share/model/shareLimits";

export function buildShareConfigModalModel({
  isOpen,
  appShareState,
  locationLike,
}: {
  isOpen: boolean;
  appShareState: unknown;
  locationLike?: { origin: string; pathname: string } | null;
}) {
  if (!isOpen) return null;
  if (!locationLike) {
    return {
      canonicalUrl: "",
      presentableUrl: "",
      sizeEvaluation: evaluateShareUrlSize(""),
    };
  }

  const payload = buildSharePayload(serializeShareState(appShareState));
  const query = serializeSharePayload(payload).toString();
  const base = `${locationLike.origin}${locationLike.pathname}`;
  const canonicalUrl = query ? `${base}?${query}` : base;

  return {
    canonicalUrl,
    presentableUrl: canonicalUrl,
    sizeEvaluation: evaluateShareUrlSize(canonicalUrl),
  };
}
