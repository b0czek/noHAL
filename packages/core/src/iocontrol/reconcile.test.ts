import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "../halExport";
import { createEmptyProject } from "../project";
import { findSystemSheet } from "../sheet";
import type { ComponentNode } from "../types";
import {
  createIocontrolSystemComponentDefinition,
  IOCONTROL_INSTANCE_NAME,
  IOCONTROL_SYSTEM_COMPONENT_ID,
} from ".";

function findIocontrolNode(project: ReturnType<typeof createEmptyProject>) {
  const systemSheet = findSystemSheet(project);
  return systemSheet?.nodes.find(
    (node): node is ComponentNode =>
      node.kind === "component" &&
      node.instanceName === IOCONTROL_INSTANCE_NAME,
  );
}

describe("iocontrol-managed system component", () => {
  it("creates a managed singleton iocontrol node in fresh projects", () => {
    const project = createEmptyProject("iocontrol defaults");
    const node = findIocontrolNode(project);
    const component = project.library.components[IOCONTROL_SYSTEM_COMPONENT_ID];

    expect(node).toBeDefined();
    expect(component).toEqual(createIocontrolSystemComponentDefinition());
    expect(node?.componentId).toBe(IOCONTROL_SYSTEM_COMPONENT_ID);
  });

  it("exports iocontrol nets without suggesting a manual loadusr command", () => {
    const project = createEmptyProject("iocontrol export");
    const systemSheet = findSystemSheet(project);
    const iocontrolNode = findIocontrolNode(project);
    expect(iocontrolNode).toBeDefined();
    if (!iocontrolNode || !systemSheet) return;

    project.library.components["test:src"] = {
      id: "test:src",
      name: "src",
      halComponentName: "src",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    systemSheet.nodes.push({
      id: "node_src",
      kind: "component",
      componentId: "test:src",
      instanceName: "src",
      position: { x: 200, y: 200 },
      paramValues: {},
    });
    systemSheet.directConnections.push({
      id: "dc_iocontrol_enable",
      a: { kind: "node-pin", nodeId: "node_src", pinKey: "out" },
      b: {
        kind: "node-pin",
        nodeId: iocontrolNode.id,
        pinKey: "emc_enable_in",
      },
      signalName: "machine_enable",
    });

    const out = exportProjectToHal(project);
    expect(out.text).toContain(
      "net machine_enable system.src.out iocontrol.0.emc-enable-in",
    );
    expect(out.text).not.toContain("iocontrol: iocontrol.0");
    expect(out.text).not.toContain("loadusr iocontrol");
  });
});
