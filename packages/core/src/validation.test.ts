import { describe, expect, it } from "vitest";
import { createEmptyProject } from "./project";
import { validateDirectConnection } from "./validation";

function addComponent(
  project: ReturnType<typeof createEmptyProject>,
  componentId: string,
  direction: "in" | "out" | "io",
): void {
  project.library.components[componentId] = {
    id: componentId,
    name: componentId,
    halComponentName: componentId.replace("comp:", ""),
    source: "manual",
    runtime: { kind: "rt" },
    pins: [{ key: "p", name: "p", direction, type: "bit" }],
    params: [],
  };
}

describe("validateDirectConnection LinuxCNC writer rules", () => {
  it("allows one OUT to fan out to multiple IN pins", () => {
    const project = createEmptyProject("validation-fanout");
    const sheet = project.sheets[project.rootSheetId];
    addComponent(project, "comp:src", "out");
    addComponent(project, "comp:a", "in");
    addComponent(project, "comp:b", "in");
    sheet.nodes.push(
      {
        id: "src",
        kind: "component",
        componentId: "comp:src",
        instanceName: "src",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "a",
        kind: "component",
        componentId: "comp:a",
        instanceName: "a",
        position: { x: 100, y: 0 },
        paramValues: {},
      },
      {
        id: "b",
        kind: "component",
        componentId: "comp:b",
        instanceName: "b",
        position: { x: 200, y: 0 },
        paramValues: {},
      },
    );
    sheet.directConnections.push({
      id: "c1",
      a: { kind: "node-pin", nodeId: "src", pinKey: "p" },
      b: { kind: "node-pin", nodeId: "a", pinKey: "p" },
    });

    const result = validateDirectConnection(
      project,
      project.rootSheetId,
      { kind: "node-pin", nodeId: "src", pinKey: "p" },
      { kind: "node-pin", nodeId: "b", pinKey: "p" },
      sheet.directConnections,
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects direct OUT to IO connection", () => {
    const project = createEmptyProject("validation-out-io");
    const sheet = project.sheets[project.rootSheetId];
    addComponent(project, "comp:src", "out");
    addComponent(project, "comp:io", "io");
    sheet.nodes.push(
      {
        id: "src",
        kind: "component",
        componentId: "comp:src",
        instanceName: "src",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "io",
        kind: "component",
        componentId: "comp:io",
        instanceName: "io",
        position: { x: 100, y: 0 },
        paramValues: {},
      },
    );

    const result = validateDirectConnection(
      project,
      project.rootSheetId,
      { kind: "node-pin", nodeId: "src", pinKey: "p" },
      { kind: "node-pin", nodeId: "io", pinKey: "p" },
      sheet.directConnections,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("OUT and IO");
  });

  it("rejects merging nets so OUT and IO end up on one signal", () => {
    const project = createEmptyProject("validation-merge");
    const sheet = project.sheets[project.rootSheetId];
    addComponent(project, "comp:out", "out");
    addComponent(project, "comp:io", "io");
    addComponent(project, "comp:in1", "in");
    addComponent(project, "comp:in2", "in");
    sheet.nodes.push(
      {
        id: "out",
        kind: "component",
        componentId: "comp:out",
        instanceName: "out",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "io",
        kind: "component",
        componentId: "comp:io",
        instanceName: "io",
        position: { x: 100, y: 0 },
        paramValues: {},
      },
      {
        id: "in1",
        kind: "component",
        componentId: "comp:in1",
        instanceName: "in1",
        position: { x: 200, y: 0 },
        paramValues: {},
      },
      {
        id: "in2",
        kind: "component",
        componentId: "comp:in2",
        instanceName: "in2",
        position: { x: 300, y: 0 },
        paramValues: {},
      },
    );
    sheet.directConnections.push(
      {
        id: "c1",
        a: { kind: "node-pin", nodeId: "out", pinKey: "p" },
        b: { kind: "node-pin", nodeId: "in1", pinKey: "p" },
      },
      {
        id: "c2",
        a: { kind: "node-pin", nodeId: "io", pinKey: "p" },
        b: { kind: "node-pin", nodeId: "in2", pinKey: "p" },
      },
    );

    const result = validateDirectConnection(
      project,
      project.rootSheetId,
      { kind: "node-pin", nodeId: "out", pinKey: "p" },
      { kind: "node-pin", nodeId: "in2", pinKey: "p" },
      sheet.directConnections,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("OUT and IO");
  });
});
