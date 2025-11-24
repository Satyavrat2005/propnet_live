const QUICKPOST_SCOPE_LABEL = "QuickPost Listing";

function buildQuickPostScope(existing?: string[]) {
  const normalized = Array.isArray(existing)
    ? Array.from(new Set(existing.filter(Boolean)))
    : [];
  if (!normalized.includes(QUICKPOST_SCOPE_LABEL)) {
    normalized.push(QUICKPOST_SCOPE_LABEL);
  }
  return normalized;
}

export { QUICKPOST_SCOPE_LABEL, buildQuickPostScope };
