import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "../halExport";
import { createId } from "../id";
import { createEmptyProject } from "../project";
import type { ComponentNode } from "../types";
import {
  createIocontrolSystemComponentDefinition,
  IOCONTROL_INSTANCE_NAME,
  IOCONTROL_SYSTEM_COMPONENT_ID,
  reconcileIocontrolManagedNodes,
} from ".";

function findIocontrolNode(project: ReturnType<typeof createEmptyProject>) {
  const root = project.sheets[project.rootSheetId];
  return root.nodes.find(
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

  it("adopts a legacy imported iocontrol node and removes duplicates", () => {
    const project = createEmptyProject("iocontrol adopt");
    const root = project.sheets[project.rootSheetId];

    root.nodes = root.nodes.filter(
      (node) =>
        !(
          node.kind === "component" &&
          node.instanceName === IOCONTROL_INSTANCE_NAME
        ),
    );

    project.library.components["halimport:legacy-iocontrol"] = {
      id: "halimport:legacy-iocontrol",
      name: "iocontrol",
      halComponentName: "iocontrol",
      source: "manual",
      runtime: { kind: "userspace" },
      pins: [],
      params: [],
    };
    root.nodes.push(
      {
        id: createId("node"),
        kind: "component",
        componentId: "halimport:legacy-iocontrol",
        instanceName: IOCONTROL_INSTANCE_NAME,
        position: { x: 200, y: 200 },
        paramValues: {},
      },
      {
        id: createId("node"),
        kind: "component",
        componentId: "halimport:legacy-iocontrol",
        instanceName: "iocontrol.1",
        position: { x: 260, y: 260 },
        paramValues: {},
      },
    );

    reconcileIocontrolManagedNodes(project);

    const node = findIocontrolNode(project);
    expect(node?.componentId).toBe(IOCONTROL_SYSTEM_COMPONENT_ID);
    expect(
      root.nodes.filter(
        (item) =>
          item.kind === "component" &&
          item.instanceName.startsWith("iocontrol."),
      ),
    ).toHaveLength(1);
    expect(
      project.library.components["halimport:legacy-iocontrol"],
    ).toBeUndefined();
  });

  it("exports iocontrol nets without suggesting a manual loadusr command", () => {
    const project = createEmptyProject("iocontrol export");
    const root = project.sheets[project.rootSheetId];
    const iocontrolNode = findIocontrolNode(project);
    expect(iocontrolNode).toBeDefined();
    if (!iocontrolNode) return;

    project.library.components["test:src"] = {
      id: "test:src",
      name: "src",
      halComponentName: "src",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    root.nodes.push({
      id: "node_src",
      kind: "component",
      componentId: "test:src",
      instanceName: "src",
      position: { x: 200, y: 200 },
      paramValues: {},
    });
    root.directConnections.push({
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
      "net machine_enable src.out iocontrol.0.emc-enable-in",
    );
    expect(out.text).not.toContain("iocontrol: iocontrol.0");
    expect(out.text).not.toContain("loadusr iocontrol");
  });
});
