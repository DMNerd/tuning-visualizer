export const SHARE_SCHEMA_VERSION = 1;

/**
 * Compact query parameter keys for share URLs.
 *
 * Product policy: instrument scope (+ systemId) only.
 */
export const SHARE_QUERY_KEYS = {
  version: "v",
  systemId: "sys",
  strings: "str",
  frets: "fr",
  tuning: "tn",
  stringMeta: "sm",
  boardMeta: "bm",
  neckFilterMode: "nm",
  presetName: "pn",
  packId: "pid",
  packPayloadVersion: "pv",
  packPayload: "pp",
} as const;

export type ShareQueryKey =
  (typeof SHARE_QUERY_KEYS)[keyof typeof SHARE_QUERY_KEYS];
