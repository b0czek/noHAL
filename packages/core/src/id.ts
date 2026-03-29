const ID_STRING_RADIX = 36;
const ID_RANDOM_SLICE_START = 2;
const ID_RANDOM_SLICE_END = 10;

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Math.random()
    .toString(ID_STRING_RADIX)
    .slice(
      ID_RANDOM_SLICE_START,
      ID_RANDOM_SLICE_END,
    )}${Date.now().toString(ID_STRING_RADIX)}`;
}

export function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

export function safeKey(input: string): string {
  const key = input
    .trim()
    .replace(/#/g, "idx")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || "unnamed";
}
