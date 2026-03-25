import {
  createMesaSystemComponentDefinition,
  deriveMesaTopology,
  normalizeProjectMesaConfig,
} from "../mesa";
import type { ProjectMesaConfig } from "../mesa/types";
import type {
  ComponentDefinition,
  HalImportDraft,
  HalImportNetEndpoint,
  HalImportSetp,
} from "../types";

const MESA_LOAD_COMPONENT_NAMES = new Set(["hm2_eth", "hostmot2"]);

interface MesaImportNodeBinding {
  component: ComponentDefinition;
  componentId: string;
  instanceName: string;
}

export interface MesaImportDetection {
  detected: boolean;
}

export interface MesaResolvedImportTarget {
  component: ComponentDefinition;
  componentId: string;
  instanceName: string;
  fieldName: string;
}

export interface MesaImportPlan {
  mesa: ProjectMesaConfig;
  topology: ReturnType<typeof deriveMesaTopology>;
  nodeBindings: MesaImportNodeBinding[];
  handledGroupIds: Set<string>;
}

function looksLikeMesaInstanceName(value: string): boolean {
  return /^hm2_[A-Za-z0-9]+(?:\.\d+)?(?:\..+)?$/.test(value.trim());
}

function looksLikeMesaFieldPath(value: string): boolean {
  return /^hm2_[A-Za-z0-9]+\./.test(value.trim());
}

function isMesaLoadGroupName(value: string): boolean {
  return MESA_LOAD_COMPONENT_NAMES.has(value.trim().toLowerCase());
}

function normalizeMesaPathSegments(value: string): string[] {
  return value
    .trim()
    .split(".")
    .filter(Boolean)
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\d+/g, (digits) => `${Number.parseInt(digits, 10)}`),
    );
}

function normalizeMesaInstanceName(value: string): string {
  return value.trim().toLowerCase();
}

function mesaSegmentsEqual(a: string[], b: string[]): boolean {
  return (
    a.length === b.length && a.every((segment, index) => segment === b[index])
  );
}

function mesaSegmentsStartWith(full: string[], prefix: string[]): boolean {
  return (
    full.length >= prefix.length &&
    prefix.every((segment, index) => segment === full[index])
  );
}

function parseMesaInstancePath(value: string): {
  hostKind: string;
  hostIndex: string;
  suffixSegments: string[];
} | null {
  const segments = value.trim().split(".").filter(Boolean);
  const hostKind = segments[0]?.trim().toLowerCase();
  const hostIndex = segments[1];
  if (!hostKind || !hostIndex || !/^\d+$/.test(hostIndex)) return null;
  return {
    hostKind,
    hostIndex,
    suffixSegments: normalizeMesaPathSegments(segments.slice(2).join(".")),
  };
}

function isMesaRawGpioDirectionField(fieldName: string): boolean {
  const segments = normalizeMesaPathSegments(fieldName);
  return (
    segments.length === 3 &&
    segments[0] === "gpio" &&
    /^\d+$/.test(segments[1] ?? "") &&
    segments[2] === "is-output"
  );
}

function resolveMesaFieldName(
  component: Pick<ComponentDefinition, "pins" | "params">,
  fieldName: string,
): string | null {
  const trimmed = fieldName.trim();
  if (!trimmed) return null;

  const exactPin = component.pins.find((pin) => pin.name === trimmed);
  if (exactPin) return exactPin.name;

  const exactParam = component.params.find((param) => param.name === trimmed);
  if (exactParam) return exactParam.name;

  const normalizedField = normalizeMesaPathSegments(trimmed);
  if (normalizedField.length === 0) return null;

  const matchingPin = component.pins.find((pin) =>
    mesaSegmentsEqual(normalizeMesaPathSegments(pin.name), normalizedField),
  );
  if (matchingPin) return matchingPin.name;

  const matchingParam = component.params.find((param) =>
    mesaSegmentsEqual(normalizeMesaPathSegments(param.name), normalizedField),
  );
  return matchingParam?.name ?? null;
}

function endpointLooksMesa(endpoint: HalImportNetEndpoint): boolean {
  return (
    looksLikeMesaInstanceName(endpoint.instanceName) ||
    looksLikeMesaFieldPath(endpoint.rawPath)
  );
}

function setpLooksMesa(setp: HalImportSetp): boolean {
  return (
    looksLikeMesaInstanceName(setp.instanceName) ||
    looksLikeMesaFieldPath(setp.rawPath)
  );
}

export function detectMesaHalImport(
  draft: HalImportDraft,
): MesaImportDetection {
  const detected =
    draft.componentGroups.some(
      (group) =>
        isMesaLoadGroupName(group.inferredHalComponentName) ||
        group.instances.some((instance) =>
          looksLikeMesaInstanceName(instance.instanceName),
        ),
    ) ||
    draft.nets.some((net) => net.endpoints.some(endpointLooksMesa)) ||
    draft.setps.some(setpLooksMesa) ||
    draft.addfs.some((addf) =>
      looksLikeMesaInstanceName(addf.instanceName ?? ""),
    );
  return { detected };
}

export function buildMesaImportPlan(
  draft: HalImportDraft,
  mesaConfig: ProjectMesaConfig,
): MesaImportPlan {
  const mesa = normalizeProjectMesaConfig(mesaConfig);
  const topology = deriveMesaTopology(mesa);
  const nodeBindings = topology.nodes.map((node) => {
    const component = createMesaSystemComponentDefinition(node);
    return {
      component,
      componentId: node.componentId,
      instanceName: node.instanceName,
    };
  });

  const exactNodeNames = new Set(
    nodeBindings.map((item) => normalizeMesaInstanceName(item.instanceName)),
  );
  const handledGroupIds = new Set<string>();

  for (const group of draft.componentGroups) {
    if (isMesaLoadGroupName(group.inferredHalComponentName)) {
      handledGroupIds.add(group.id);
      continue;
    }
    if (
      group.instances.some((instance) =>
        exactNodeNames.has(normalizeMesaInstanceName(instance.instanceName)),
      )
    ) {
      handledGroupIds.add(group.id);
    }
  }

  return {
    mesa,
    topology,
    nodeBindings,
    handledGroupIds,
  };
}

export function shouldIgnoreMesaImportSetp(
  plan: MesaImportPlan | null | undefined,
  instanceName: string,
  fieldName: string,
): boolean {
  if (!plan) return false;
  const importedInstance = parseMesaInstancePath(instanceName.trim());
  if (!importedInstance) return false;
  if (importedInstance.suffixSegments.length !== 0) return false;
  return isMesaRawGpioDirectionField(fieldName);
}

export function resolveMesaImportTarget(
  plan: MesaImportPlan | null | undefined,
  instanceName: string,
  fieldName: string,
): MesaResolvedImportTarget | null {
  if (!plan) return null;
  const trimmedInstance = instanceName.trim();
  const trimmedField = fieldName.trim();
  if (!trimmedInstance || !trimmedField) return null;
  const normalizedInstance = normalizeMesaInstanceName(trimmedInstance);

  const direct = plan.nodeBindings.find(
    (binding) =>
      normalizeMesaInstanceName(binding.instanceName) === normalizedInstance,
  );
  const directFieldName = direct
    ? resolveMesaFieldName(direct.component, trimmedField)
    : null;
  if (direct && directFieldName) {
    return {
      component: direct.component,
      componentId: direct.componentId,
      instanceName: direct.instanceName,
      fieldName: directFieldName,
    };
  }

  const fieldSegments = trimmedField.split(".").filter(Boolean);
  const normalizedFieldSegments = normalizeMesaPathSegments(trimmedField);
  const nestedCandidates = plan.nodeBindings
    .filter((binding) =>
      normalizeMesaInstanceName(binding.instanceName).startsWith(
        `${normalizedInstance}.`,
      ),
    )
    .map((binding) => ({
      binding,
      suffixSegments: normalizeMesaPathSegments(
        binding.instanceName.slice(trimmedInstance.length + 1),
      ),
    }))
    .filter(
      (candidate) =>
        normalizedFieldSegments.length > candidate.suffixSegments.length &&
        mesaSegmentsStartWith(
          normalizedFieldSegments,
          candidate.suffixSegments,
        ),
    )
    .sort((a, b) => b.suffixSegments.length - a.suffixSegments.length);

  for (const candidate of nestedCandidates) {
    const nextField = fieldSegments
      .slice(candidate.suffixSegments.length)
      .join(".");
    if (!nextField) continue;
    const resolvedFieldName = resolveMesaFieldName(
      candidate.binding.component,
      nextField,
    );
    if (!resolvedFieldName) continue;
    return {
      component: candidate.binding.component,
      componentId: candidate.binding.componentId,
      instanceName: candidate.binding.instanceName,
      fieldName: resolvedFieldName,
    };
  }

  const importedInstance = parseMesaInstancePath(trimmedInstance);
  if (!importedInstance) return null;

  const combinedImportedSegments = [
    ...importedInstance.suffixSegments,
    ...normalizedFieldSegments,
  ];
  const structuralCandidates = plan.nodeBindings
    .flatMap((binding) => {
      const parsed = parseMesaInstancePath(binding.instanceName);
      if (
        !parsed ||
        parsed.hostKind !== importedInstance.hostKind ||
        parsed.hostIndex !== importedInstance.hostIndex
      ) {
        return [];
      }
      return [{ binding, parsed }];
    })
    .sort(
      (a, b) => b.parsed.suffixSegments.length - a.parsed.suffixSegments.length,
    );

  for (const candidate of structuralCandidates) {
    if (
      !mesaSegmentsStartWith(
        combinedImportedSegments,
        candidate.parsed.suffixSegments,
      )
    ) {
      continue;
    }
    const nextFieldSegments = combinedImportedSegments.slice(
      candidate.parsed.suffixSegments.length,
    );
    if (nextFieldSegments.length === 0) continue;
    const resolvedFieldName = resolveMesaFieldName(
      candidate.binding.component,
      nextFieldSegments.join("."),
    );
    if (!resolvedFieldName) continue;
    return {
      component: candidate.binding.component,
      componentId: candidate.binding.componentId,
      instanceName: candidate.binding.instanceName,
      fieldName: resolvedFieldName,
    };
  }

  return null;
}
