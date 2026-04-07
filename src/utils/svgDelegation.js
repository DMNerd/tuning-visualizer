/**
 * Utilities for delegated SVG interaction handling.
 *
 * Usage pattern:
 * 1. Add `data-*` attributes on interactive SVG child nodes.
 * 2. Attach one shared handler on a parent `<g>` or `<svg>`.
 * 3. Resolve closest matching dataset-bearing element from `event.target`.
 * 4. Parse typed dataset values (e.g. number pitch classes) before dispatching.
 *
 * This keeps SVG trees lightweight and avoids per-node closure handlers.
 */

function toElement(target) {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target.parentElement instanceof Element) return target.parentElement;
  return null;
}

export function resolveClosestDatasetElement(target, selector) {
  const element = toElement(target);
  if (!element) return null;
  return element.closest(selector);
}

export function parseDatasetNumber(element, key) {
  if (!element) return null;
  const value = element.dataset?.[key];
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function maybePreventContextMenu(event, shouldPrevent = false) {
  if (shouldPrevent) {
    event.preventDefault();
  }
}
