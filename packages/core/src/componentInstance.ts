import type { ComponentDefinition, ComponentPinDefinition } from "./types";

function resolveCountConfigValue(
  component: ComponentDefinition,
  countConfigKey: string,
  instanceConfigValues: Record<string, string> | undefined,
): number {
  const field = component.runtime?.instanceConfig?.fields.find(
    (item) => item.key === countConfigKey,
  );
  const rawValue =
    instanceConfigValues?.[countConfigKey] ?? `${field?.defaultValue ?? ""}`;
  const parsed = Number.parseInt(`${rawValue ?? ""}`, 10);
  const fallback =
    typeof field?.defaultValue === "number"
      ? Math.round(field.defaultValue)
      : Number.parseInt(`${field?.defaultValue ?? ""}`, 10);
  let count =
    Number.isFinite(parsed) && parsed >= 0
      ? parsed
      : Number.isFinite(fallback) && fallback >= 0
        ? fallback
        : 0;
  const min = field?.min;
  const max = field?.max;
  if (Number.isFinite(min)) count = Math.max(min ?? count, count);
  if (Number.isFinite(max)) count = Math.min(max ?? count, count);
  return count;
}

// Supports plain and zero-padded index placeholders used by pin templates.
function replaceIndexTemplate(template: string, index: number): string {
  return template
    .replaceAll("{index3}", `${index}`.padStart(3, "0"))
    .replaceAll("{index2}", `${index}`.padStart(2, "0"))
    .replaceAll("{index}", `${index}`);
}

export function resolveComponentPinsForInstance(
  component: ComponentDefinition,
  instanceConfigValues?: Record<string, string>,
): ComponentPinDefinition[] {
  const pins = [...component.pins];
  const rules = component.runtime?.instanceConfig?.pinExpansionRules ?? [];

  for (const rule of rules) {
    if (rule.kind !== "indexed_by_count") continue;
    const count = resolveCountConfigValue(
      component,
      rule.countConfigKey,
      instanceConfigValues,
    );
    const indexStart = Number.isFinite(rule.indexStart)
      ? Math.trunc(rule.indexStart ?? 0)
      : 0;
    for (let offset = 0; offset < count; offset += 1) {
      const index = indexStart + offset;
      for (const template of rule.templates) {
        pins.push({
          key: replaceIndexTemplate(template.keyTemplate, index),
          name: replaceIndexTemplate(template.nameTemplate, index),
          direction: template.direction,
          type: template.type,
          ...(template.doc ? { doc: template.doc } : {}),
        });
      }
    }
  }

  return pins;
}
