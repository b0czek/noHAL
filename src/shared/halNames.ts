const HAL_NAME_RE = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

export function isValidHalName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!HAL_NAME_RE.test(trimmed)) return false;
  if (trimmed.startsWith(".") || trimmed.endsWith(".")) return false;
  if (trimmed.includes("..")) return false;
  return true;
}
