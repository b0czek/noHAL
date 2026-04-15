import { resolveComponentPinsForInstance } from "../../component/instance";
import { createId } from "../../id";
import type {
  ComponentDefinition,
  ComponentNode,
  ComponentPinDefinition,
  SheetDefinition,
} from "../../types";

export interface ImportedNodeRegistry {
  nodeIdByInstanceName: Map<string, string>;
  pinKeyByInstanceAndPinName: Map<string, string>;
  pinDirectionByInstanceAndPinName: Map<
    string,
    ComponentPinDefinition["direction"]
  >;
  nodeRefById: Map<string, ComponentNode>;
  componentByNodeId: Map<string, ComponentDefinition>;
  nodeInstanceNameById: Map<string, string>;
  nodeInstanceConfigById: Map<string, Record<string, string> | undefined>;
  resolvedPinsByNodeId: Map<string, ComponentPinDefinition[]>;
}

export function createImportedNodeRegistry(): ImportedNodeRegistry {
  return {
    nodeIdByInstanceName: new Map(),
    pinKeyByInstanceAndPinName: new Map(),
    pinDirectionByInstanceAndPinName: new Map(),
    nodeRefById: new Map(),
    componentByNodeId: new Map(),
    nodeInstanceNameById: new Map(),
    nodeInstanceConfigById: new Map(),
    resolvedPinsByNodeId: new Map(),
  };
}

export function registerImportedNode(options: {
  rootSheet: SheetDefinition;
  registry: ImportedNodeRegistry;
  componentId: string;
  component: ComponentDefinition;
  instanceName: string;
  instanceConfigValues?: Record<string, string>;
  exportStage?: ComponentNode["exportStage"];
}): void {
  const nodeId = createId("node");
  options.rootSheet.nodes.push({
    id: nodeId,
    kind: "component",
    componentId: options.componentId,
    instanceName: options.instanceName,
    position: { x: 0, y: 0 },
    paramValues: {},
    ...(options.instanceConfigValues &&
    Object.keys(options.instanceConfigValues).length > 0
      ? { instanceConfigValues: { ...options.instanceConfigValues } }
      : {}),
    ...(options.exportStage ? { exportStage: options.exportStage } : {}),
  });

  const node = options.rootSheet.nodes[
    options.rootSheet.nodes.length - 1
  ] as ComponentNode;
  options.registry.nodeRefById.set(nodeId, node);
  options.registry.nodeIdByInstanceName.set(options.instanceName, nodeId);
  options.registry.componentByNodeId.set(nodeId, options.component);
  options.registry.nodeInstanceNameById.set(nodeId, options.instanceName);
  options.registry.nodeInstanceConfigById.set(
    nodeId,
    options.instanceConfigValues,
  );

  const resolvedPins = resolveComponentPinsForInstance(
    options.component,
    options.instanceConfigValues,
  );
  options.registry.resolvedPinsByNodeId.set(nodeId, resolvedPins);
  for (const pin of resolvedPins) {
    const pinRefKey = `${options.instanceName}::${pin.name}`;
    options.registry.pinKeyByInstanceAndPinName.set(pinRefKey, pin.key);
    options.registry.pinDirectionByInstanceAndPinName.set(
      pinRefKey,
      pin.direction,
    );
  }
}
