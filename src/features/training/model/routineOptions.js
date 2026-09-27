export function optionsWithFallback(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) return options;
  // Preserve a value decoded from a link/older catalog that no longer
  // matches a current option, rather than silently dropping it.
  return [...options, currentValue];
}
