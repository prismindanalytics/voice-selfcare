const RESOLVE_PROVIDER_KEYS = new Set([
  'location',
  'need',
  'provider_type',
  'urgency',
  'items',
  'tests'
]);

export function sanitizeProviderLookupArgs(toolName, args = {}) {
  const source = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
  if (toolName !== 'resolve_providers') return { ...source };

  return Object.fromEntries(
    Object.entries(source).filter(([key]) => RESOLVE_PROVIDER_KEYS.has(key))
  );
}
