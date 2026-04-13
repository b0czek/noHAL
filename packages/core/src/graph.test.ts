import { describe, expect, it } from "vitest";
import { getNodePins } from "./graph";
import { createEmptyProject } from "./project";

describe("graph pin ordering", () => {
  it("applies per-instance pin order while keeping unresolved pins in default order", () => {
    const project = createEmptyProject("Pin Order");
    const componentId = "manual:test";
    project.library.components[componentId] = {
      id: componentId,
      name: "test",
      halComponentName: "test",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [
        { key: "a", name: "a", direction: "in", type: "bit" },
        { key: "b", name: "b", direction: "in", type: "bit" },
        { key: "c", name: "c", direction: "out", type: "bit" },
      ],
      params: [],
    };

    const rootSheet = project.sheets[project.rootSheetId];
    rootSheet.nodes.push({
      id: "node_test",
      kind: "component",
      componentId,
      instanceName: "test.0",
      position: { x: 0, y: 0 },
      paramValues: {},
      pinOrder: ["c", "missing", "a"],
    });

    const node = rootSheet.nodes.find((entry) => entry.id === "node_test");
    expect(node?.kind).toBe("component");
    if (node?.kind !== "component") return;

    expect(getNodePins(project, node).map((pin) => pin.key)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});
