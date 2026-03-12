import { describe, expect, it } from "vitest";
import type { SheetDefinition } from "../types";
import { sheetEdits } from "./wireEdit";

function createSheet(): SheetDefinition {
  return {
    id: "sheet-1",
    name: "Root",
    parentSheetId: null,
    nodes: [],
    ports: [],
    labels: [],
    comments: [],
    directConnections: [],
    labelAnchors: [],
  };
}

describe("sheet edit helpers", () => {
  it("adds and removes direct connections", () => {
    const sheet = createSheet();

    const connection = sheetEdits.connection.add(sheet, {
      a: { kind: "sheet-port", portId: "port-a" },
      b: { kind: "sheet-port", portId: "port-b" },
      signalName: "sig",
      waypoints: [{ x: 10, y: 20 }],
    });

    expect(connection.signalName).toBe("sig");
    expect(connection.waypoints).toEqual([{ x: 10, y: 20 }]);
    expect(sheetEdits.connection.remove(sheet, connection.id)).toBe(true);
    expect(sheet.directConnections).toHaveLength(0);
  });

  it("adds label anchors without duplicates", () => {
    const sheet = createSheet();

    expect(
      sheetEdits.labelAnchor.add(sheet, "label-1", {
        kind: "sheet-port",
        portId: "port-a",
      }),
    ).toBe(true);
    expect(
      sheetEdits.labelAnchor.add(sheet, "label-1", {
        kind: "sheet-port",
        portId: "port-a",
      }),
    ).toBe(false);
    expect(sheet.labelAnchors).toHaveLength(1);
  });

  it("updates waypoints and signal names", () => {
    const sheet = createSheet();
    const connection = sheetEdits.connection.add(sheet, {
      a: { kind: "sheet-port", portId: "port-a" },
      b: { kind: "sheet-port", portId: "port-b" },
    });

    expect(
      sheetEdits.connection.waypoints.update(sheet, connection.id, [
        { x: 40, y: 50 },
      ]),
    ).toBe(true);
    expect(connection.waypoints).toEqual([{ x: 40, y: 50 }]);
    expect(
      sheetEdits.connection.signalName.update(sheet, connection.id, "my_sig"),
    ).toBe(true);
    expect(connection.signalName).toBe("my_sig");
    expect(
      sheetEdits.connection.signalName.update(sheet, connection.id, ""),
    ).toBe(true);
    expect(connection.signalName).toBeUndefined();
  });

  it("splits a direct connection into two local labels and anchors", () => {
    const sheet = createSheet();
    const connection = sheetEdits.connection.add(sheet, {
      a: { kind: "sheet-port", portId: "port-a" },
      b: { kind: "sheet-port", portId: "port-b" },
      signalName: "joint-enable",
    });

    const result = sheetEdits.connection.splitIntoLabels(sheet, connection.id, {
      firstLabelPosition: { x: 100, y: 200 },
      secondLabelPosition: { x: 240, y: 200 },
    });

    expect(result?.labelName).toBe("joint-enable");
    expect(sheet.directConnections).toHaveLength(0);
    expect(sheet.labels).toHaveLength(2);
    expect(sheet.labels.every((label) => label.name === "joint-enable")).toBe(
      true,
    );
    expect(sheet.labelAnchors).toHaveLength(2);
  });
});
