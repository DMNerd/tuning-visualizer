// First byte of a binary routine link. Version 1 links were JSON and still
// decode (see routineCodec).
export const ROUTINE_LINK_FORMAT = 2;

/**
 * Compact query parameter key for routine share URLs.
 *
 * Confirmed not to collide with SHARE_QUERY_KEYS
 * (v, sys, str, fr, tn, sm, bm, nm, pn, pid, pv, pp) so a routine link can
 * compose alongside an instrument Quickshare link in the same URL.
 */
export const ROUTINE_QUERY_KEY = "rt";
