import {
  buildGeneratedLocalComponentsFromHalImport,
  buildMesaImportPlan,
  isSystemHalImportComponentGroup,
  suggestHalImportLinks,
} from "@nohal/core/halImport";
import type { LinuxCncVersion } from "@nohal/core/linuxcncVersion";
import type { ProjectMesaConfig } from "@nohal/core/mesa";
import type {
  ComponentDefinition,
  ComponentStore,
  HalImportDraft,
  HalImportLinkSelection,
  MachineConfigImportDraft,
} from "@nohal/core/types";

export function toLinkSelections(
  draft: HalImportDraft,
  encodedSelections: Record<string, string>,
): Record<string, HalImportLinkSelection> {
  return Object.fromEntries(
    draft.componentGroups.map((group) => {
      const value = encodedSelections[group.id] ?? "local";
      if (value.startsWith("store:")) {
        return [
          group.id,
          {
            groupId: group.id,
            mode: "store" as const,
            componentId: value.slice("store:".length),
          },
        ];
      }
      return [group.id, { groupId: group.id, mode: "project-local" as const }];
    }),
  );
}

export function buildGeneratedLocalComponents(args: {
  draft: HalImportDraft;
  encodedSelections: Record<string, string>;
  componentStore: ComponentStore;
}): Record<string, ComponentDefinition> {
  return buildGeneratedLocalComponentsFromHalImport({
    draft: args.draft,
    componentStore: args.componentStore,
    linkSelections: toLinkSelections(args.draft, args.encodedSelections),
  });
}

export function prepareLinkStepState(args: {
  draft: HalImportDraft;
  machineConfigImport: MachineConfigImportDraft;
  mesaConfig: ProjectMesaConfig | null;
  componentStore: ComponentStore;
  linuxcncVersion: LinuxCncVersion;
  systemAutoReason: string;
  mesaSystemAutoReason: string;
}) {
  const suggestions = suggestHalImportLinks(args.draft, args.componentStore, {
    linuxcncVersion: args.linuxcncVersion,
  });
  const mesaPlan = args.mesaConfig
    ? buildMesaImportPlan(args.draft, args.mesaConfig)
    : null;
  const systemLinkGroupIds = new Set<string>();
  const nextSelections: Record<string, string> = {};
  const nextReasons: Record<string, string> = {};

  for (const suggestion of suggestions) {
    const group = args.draft.componentGroups.find(
      (item) => item.id === suggestion.groupId,
    );
    const isSystemGroup = group
      ? isSystemHalImportComponentGroup(group)
      : false;
    const isMesaSystemGroup = mesaPlan?.handledGroupIds.has(suggestion.groupId);
    if (isSystemGroup || isMesaSystemGroup) {
      systemLinkGroupIds.add(suggestion.groupId);
    }
    if (suggestion.selection.mode === "store") {
      nextSelections[suggestion.groupId] =
        `store:${suggestion.selection.componentId}`;
    } else if (isSystemGroup || isMesaSystemGroup) {
      nextSelections[suggestion.groupId] = "system";
    } else {
      nextSelections[suggestion.groupId] = "local";
    }

    if (isSystemGroup) {
      nextReasons[suggestion.groupId] = args.systemAutoReason;
    } else if (isMesaSystemGroup) {
      nextReasons[suggestion.groupId] = args.mesaSystemAutoReason;
    } else {
      nextReasons[suggestion.groupId] = suggestion.reason;
    }
  }

  return {
    draft: args.draft,
    machineConfigImport: args.machineConfigImport,
    step: "link" as const,
    mesaDetected: Boolean(mesaPlan),
    mesaConfig: args.mesaConfig,
    linkSelections: nextSelections,
    linkReasons: nextReasons,
    systemLinkGroupIds: [...systemLinkGroupIds],
    generatedLocalComponents: buildGeneratedLocalComponents({
      draft: args.draft,
      encodedSelections: nextSelections,
      componentStore: args.componentStore,
    }),
  };
}
