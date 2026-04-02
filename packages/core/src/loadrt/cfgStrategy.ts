import { pullObject } from "remeda";
import { isCanonicalIndexedInstanceNames } from "./namesOrCountStrategy";
import type {
  LoadrtContext,
  LoadrtImportContext,
  LoadrtImportResult,
  LoadrtResult,
  LoadrtStrategy,
} from "./types";

interface NormalizedCfgRule {
  key: string;
  defaultValue: number;
  min?: number;
  max?: number;
}

const DEFAULT_CFG_INSTANCE_CONFIG_KEY = "channels";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function inferCfgInstanceConfigKey(context: LoadrtContext): string {
  for (const rule of context.runtime?.instanceConfig?.pinExpansionRules ?? []) {
    if (rule.kind !== "indexed_by_count") continue;
    const key = rule.countConfigKey.trim();
    if (key) return key;
  }
  for (const field of context.runtime?.instanceConfig?.fields ?? []) {
    if (field.key.trim() === DEFAULT_CFG_INSTANCE_CONFIG_KEY) return field.key;
  }
  for (const field of context.runtime?.instanceConfig?.fields ?? []) {
    if (field.type === "integer" || field.type === "number") {
      const key = field.key.trim();
      if (key) return key;
    }
  }
  const first = context.runtime?.instanceConfig?.fields[0]?.key?.trim();
  return first || DEFAULT_CFG_INSTANCE_CONFIG_KEY;
}

function normalizeCfgRule(context: LoadrtContext): NormalizedCfgRule {
  const key = inferCfgInstanceConfigKey(context);
  const field = context.runtime?.instanceConfig?.fields.find(
    (item) => item.key === key,
  );
  return {
    key,
    defaultValue: parsePositiveInt(`${field?.defaultValue ?? ""}`, 1),
    ...(Number.isFinite(field?.min) ? { min: field?.min } : {}),
    ...(Number.isFinite(field?.max) ? { max: field?.max } : {}),
  };
}

function clampCfgValue(value: number, rule: NormalizedCfgRule): number {
  let out = value;
  if (rule.min !== undefined) out = Math.max(rule.min, out);
  if (rule.max !== undefined) out = Math.min(rule.max, out);
  return out;
}

function resolveInstanceCfgValue(
  context: LoadrtContext,
  instancePath: string,
  rule: NormalizedCfgRule,
  warnings: string[],
): number {
  const raw = context.instanceConfigByPath?.[instancePath]?.[rule.key];
  const parsed = Number.parseInt(raw ?? "", 10);
  const baseValue =
    Number.isFinite(parsed) && parsed > 0 ? parsed : rule.defaultValue;
  if (raw !== undefined && (!Number.isFinite(parsed) || parsed < 1)) {
    warnings.push(
      `Component '${context.componentName}' ignored invalid ${rule.key}='${raw}' on '${instancePath}' (using ${rule.defaultValue})`,
    );
  }
  return clampCfgValue(baseValue, rule);
}

function importCfg(context: LoadrtImportContext): LoadrtImportResult {
  const warnings: string[] = [];
  const cfgArg = context.args.cfg?.trim();
  const cfgValues: number[] = [];

  if (cfgArg) {
    for (const [index, rawPart] of cfgArg.split(",").entries()) {
      const part = rawPart.trim();
      if (!part) {
        warnings.push(
          `Component '${context.componentName}' ignored empty cfg entry at index ${index}`,
        );
        continue;
      }
      const value = Number.parseInt(part, 10);
      if (!Number.isFinite(value)) {
        warnings.push(
          `Component '${context.componentName}' ignored non-integer cfg entry '${part}' at index ${index}`,
        );
        continue;
      }
      if (value <= 0) {
        warnings.push(
          `Component '${context.componentName}' stopped cfg parsing at entry ${index} with non-positive value ${value}`,
        );
        break;
      }
      cfgValues.push(value);
    }
  } else {
    warnings.push(
      `Component '${context.componentName}' missing cfg=... while routed to cfg loadrt strategy; defaulting to one channel group`,
    );
  }

  const effectiveCfgValues = cfgValues.length > 0 ? cfgValues : [1];
  const instancePaths = effectiveCfgValues.map(
    (_, index) => `${context.componentName}.${index}`,
  );
  const instanceConfigByPath = pullObject(
    instancePaths,
    (instancePath) => instancePath,
    (_instancePath, index) => ({
      [DEFAULT_CFG_INSTANCE_CONFIG_KEY]: `${effectiveCfgValues[index] ?? 1}`,
    }),
  );

  return {
    instancePaths,
    instanceConfigByPath,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

function exportCfg(context: LoadrtContext): LoadrtResult {
  const warnings: string[] = [];
  const cfgRule = normalizeCfgRule(context);
  const isCanonical = isCanonicalIndexedInstanceNames(
    context.componentName,
    context.instancePaths,
  );
  if (!isCanonical) {
    warnings.push(
      `Component '${context.componentName}' expected canonical instance names '${context.componentName}.N' for cfg=... export`,
    );
  }

  const cfgValues = context.instancePaths.map((instancePath) =>
    resolveInstanceCfgValue(context, instancePath, cfgRule, warnings),
  );
  const cfgArg = `cfg=${cfgValues.join(",")}`;
  const filteredExtraArgs = context.extraArgs.filter(
    (arg) => !arg.trim().startsWith("cfg="),
  );
  if (filteredExtraArgs.length !== context.extraArgs.length) {
    warnings.push(
      `Component '${context.componentName}' ignored export rule cfg=... overrides; cfg is generated from instance config`,
    );
  }
  return {
    lines: [
      `loadrt ${context.componentName} ${[cfgArg, ...filteredExtraArgs].join(" ")}`.trim(),
    ],
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

export const cfgLoadrtStrategy: LoadrtStrategy = {
  export: exportCfg,
  import: importCfg,
};
