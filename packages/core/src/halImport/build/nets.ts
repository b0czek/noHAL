import { createId } from "../../id";
import type { HalImportBuildOptions, SheetDefinition } from "../../types";
import type { buildMesaImportPlan } from "../mesa";
import { resolveMesaImportTarget } from "../mesa";
import { buildLabel } from "./constants";
import type {
  ImportedLabelPositionResolver,
  ImportPreparedEndpoint,
  ImportPreparedNet,
} from "./layoutTypes";
import { findMatchingComponentPin } from "./matching";
import type { ImportedNodeRegistry } from "./registry";

type MesaImportPlan = ReturnType<typeof buildMesaImportPlan>;

export function resolveNetEndpointsForImport(options: {
  draft: HalImportBuildOptions["draft"];
  registry: ImportedNodeRegistry;
  mesaImportPlan: MesaImportPlan | null;
  warnings: string[];
}): ImportPreparedNet[] {
  const preparedNets: ImportPreparedNet[] = [];

  for (const net of options.draft.nets) {
    if (net.endpoints.length === 0) {
      options.warnings.push(
        `Line ${net.line}: net '${net.name}' has no parsed endpoints`,
      );
      preparedNets.push({
        net,
        resolvedEndpoints: [],
        directConnectionEdges: [],
      });
      continue;
    }

    const resolvedEndpoints: ImportPreparedEndpoint[] = [];
    for (const endpoint of net.endpoints) {
      const mesaTarget = resolveMesaImportTarget(
        options.mesaImportPlan,
        endpoint.instanceName,
        endpoint.pinName,
      );
      const targetInstanceName =
        mesaTarget?.instanceName ?? endpoint.instanceName;
      const targetPinName = mesaTarget?.fieldName ?? endpoint.pinName;
      const nodeId =
        options.registry.nodeIdByInstanceName.get(targetInstanceName);
      if (!nodeId) {
        options.warnings.push(
          `Line ${net.line}: missing node for endpoint '${endpoint.rawPath}'`,
        );
        continue;
      }

      const pinRefKey = `${targetInstanceName}::${targetPinName}`;
      let pinKey = options.registry.pinKeyByInstanceAndPinName.get(pinRefKey);
      let direction =
        options.registry.pinDirectionByInstanceAndPinName.get(pinRefKey);

      if (!pinKey) {
        const component = options.registry.componentByNodeId.get(nodeId);
        const matchedPin = findMatchingComponentPin(
          component,
          targetPinName,
          options.registry.nodeInstanceConfigById.get(nodeId),
        );
        if (matchedPin) {
          pinKey = matchedPin.key;
          direction = matchedPin.direction;
          options.registry.pinKeyByInstanceAndPinName.set(
            pinRefKey,
            matchedPin.key,
          );
          options.registry.pinDirectionByInstanceAndPinName.set(
            pinRefKey,
            matchedPin.direction,
          );
        }
      }

      if (!pinKey) {
        options.warnings.push(
          `Line ${net.line}: component pin '${targetPinName}' not found on '${targetInstanceName}'`,
        );
        continue;
      }

      if (
        resolvedEndpoints.some(
          (item) => item.nodeId === nodeId && item.pinKey === pinKey,
        )
      ) {
        continue;
      }

      resolvedEndpoints.push({
        nodeId,
        pinKey,
        pinRefKey,
        direction,
      });
    }

    preparedNets.push({ net, resolvedEndpoints, directConnectionEdges: [] });
  }

  return preparedNets;
}

export function applyPreparedNets(options: {
  rootSheet: SheetDefinition;
  preparedNets: ImportPreparedNet[];
  resolveLabelPosition: ImportedLabelPositionResolver;
}): void {
  const anchoredNetEndpoints = new Set<string>();
  const directConnectionPairs = new Set<string>();

  options.preparedNets.forEach(
    ({ net, resolvedEndpoints, directConnectionEdges }, index) => {
      if (directConnectionEdges.length > 0) {
        for (const edge of directConnectionEdges) {
          const pairKeyA = `${edge.a.nodeId}:${edge.a.pinKey}`;
          const pairKeyB = `${edge.b.nodeId}:${edge.b.pinKey}`;
          const pairKey =
            pairKeyA < pairKeyB
              ? `${pairKeyA}|${pairKeyB}`
              : `${pairKeyB}|${pairKeyA}`;
          if (directConnectionPairs.has(pairKey)) continue;
          directConnectionPairs.add(pairKey);
          options.rootSheet.directConnections.push({
            id: createId("conn"),
            a: {
              kind: "node-pin",
              nodeId: edge.a.nodeId,
              pinKey: edge.a.pinKey,
            },
            b: {
              kind: "node-pin",
              nodeId: edge.b.nodeId,
              pinKey: edge.b.pinKey,
            },
            signalName: net.name,
          });
        }
        return;
      }

      for (const [endpointIndex, item] of resolvedEndpoints.entries()) {
        const dedupeKey = `${net.name}::${item.nodeId}::${item.pinKey}`;
        if (anchoredNetEndpoints.has(dedupeKey)) continue;
        anchoredNetEndpoints.add(dedupeKey);

        const labelId = createId("label");
        options.rootSheet.labels.push({
          id: labelId,
          name: net.name,
          scope: "global",
          rotation: item.direction === "io" ? buildLabel.io.rotation : 0,
          position: options.resolveLabelPosition(
            item.nodeId,
            item.direction,
            net.name,
            item.pinKey,
            index,
            endpointIndex,
          ),
        });
        options.rootSheet.labelAnchors.push({
          id: createId("anchor"),
          labelId,
          endpoint: {
            kind: "node-pin",
            nodeId: item.nodeId,
            pinKey: item.pinKey,
          },
        });
      }
    },
  );
}
