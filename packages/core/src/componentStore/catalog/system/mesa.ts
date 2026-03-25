import type { MesaDerivedNode } from "../../../mesa/derive";
import {
  paramsForMesaSchemaProfile,
  pinsForMesaSchemaProfile,
} from "../../../mesa/schema";
import type { ComponentDefinition } from "../../../types";

export const MESA_SYSTEM_MANAGER = "mesa" as const;

function sanitizeToken(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]+/g, "_");
}

export function createMesaSystemComponentDefinition(
  node: MesaDerivedNode,
): ComponentDefinition {
  const runtime =
    node.family === "host"
      ? { kind: "rt" as const }
      : { kind: "unknown" as const };
  const functions =
    node.family === "host"
      ? [
          {
            key: "read",
            declaredName: "read",
            halSuffix: "read",
            floatMode: "nofp" as const,
          },
          {
            key: "write",
            declaredName: "write",
            halSuffix: "write",
            floatMode: "nofp" as const,
          },
        ]
      : undefined;
  return {
    id: node.componentId,
    name: node.displayName,
    halComponentName:
      node.family === "pseudo"
        ? `mesa_${sanitizeToken(node.subfamily ?? "component")}`
        : `mesa_${node.family}`,
    source: "manual",
    system: {
      manager: MESA_SYSTEM_MANAGER,
      family: node.family,
      ...(node.subfamily ? { subfamily: node.subfamily } : {}),
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
    constraints: {
      fixedInstanceName: node.instanceName,
    },
    runtime,
    pins: pinsForMesaSchemaProfile(node.schemaProfile),
    params: paramsForMesaSchemaProfile(node.schemaProfile),
    ...(functions ? { functions } : {}),
    docs: {
      description: `System-managed Mesa ${node.subfamily ?? node.family} node. Generated from project Mesa configuration (${node.summary}).`,
    },
  };
}
