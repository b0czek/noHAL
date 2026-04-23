import { describe, expect, it } from "vitest";
import { expectErr, expectOk } from "../testUtils/result";
import type { SheetDefinition } from "../types";
import { sheetEdits } from "./wireEdit";

function createSheet(): SheetDefinition {
  return {
    id: "sheet-1",
    name: "Root",
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

    const connection = expectOk(
      sheetEdits.connection.add(sheet, {
        a: { kind: "sheet-port", portId: "port-a" },
        b: { kind: "sheet-port", portId: "port-b" },
        signalName: "sig",
        waypoints: [{ x: 10, y: 20 }],
      }),
    ).data;

    expect(connection.signalName).toBe("sig");
    expect(connection.waypoints).toEqual([{ x: 10, y: 20 }]);
    expectOk(sheetEdits.connection.remove(sheet, connection.id));
    expect(sheet.directConnections).toHaveLength(0);
  });

  it("reports direct connection edit failures", () => {
    const sheet = createSheet();

    expect(
      expectErr(
        sheetEdits.connection.add(sheet, {
          a: { kind: "sheet-port", portId: "port-a" },
          b: { kind: "sheet-port", portId: "port-b" },
          signalName: "not a hal name",
        }),
      ),
    ).toEqual({
      code: "invalid-input",
      cause: "direct-connection-signal-name",
      detail: "invalid-name",
      meta: { name: "not a hal name" },
    });

    expectErr(sheetEdits.connection.remove(sheet, "conn-missing"));
  });

  it("adds label anchors without duplicates", () => {
    const sheet = createSheet();
    sheet.labels.push({
      id: "label-1",
      name: "sig",
      scope: "local",
      position: { x: 0, y: 0 },
    });

    const added = expectOk(
      sheetEdits.labelAnchor.add(sheet, "label-1", {
        kind: "sheet-port",
        portId: "port-a",
      }),
    );
    expect(added.changed).toBe(true);

    const duplicate = expectOk(
      sheetEdits.labelAnchor.add(sheet, "label-1", {
        kind: "sheet-port",
        portId: "port-a",
      }),
    );
    expect(duplicate.changed).toBe(false);
    expect(sheet.labelAnchors).toHaveLength(1);
  });

  it("reports label anchor edit failures", () => {
    const sheet = createSheet();

    expect(
      expectErr(
        sheetEdits.labelAnchor.add(sheet, "label-missing", {
          kind: "sheet-port",
          portId: "port-a",
        }),
      ),
    ).toEqual({
      code: "not-found",
      cause: "label",
    });
    expectErr(sheetEdits.labelAnchor.remove(sheet, "anchor-missing"));
  });

  it("updates waypoints and signal names", () => {
    const sheet = createSheet();
    const connection = expectOk(
      sheetEdits.connection.add(sheet, {
        a: { kind: "sheet-port", portId: "port-a" },
        b: { kind: "sheet-port", portId: "port-b" },
      }),
    ).data;

    const waypoints = expectOk(
      sheetEdits.connection.waypoints.update(sheet, connection.id, [
        { x: 40, y: 50 },
      ]),
    );
    expect(waypoints.changed).toBe(true);
    expect(connection.waypoints).toEqual([{ x: 40, y: 50 }]);
    const renamed = expectOk(
      sheetEdits.connection.signalName.update(sheet, connection.id, "my_sig"),
    );
    expect(renamed.changed).toBe(true);
    expect(connection.signalName).toBe("my_sig");

    const cleared = expectOk(
      sheetEdits.connection.signalName.update(sheet, connection.id, ""),
    );
    expect(cleared.changed).toBe(true);
    expect(connection.signalName).toBeUndefined();
  });

  it("splits a direct connection into two local labels and anchors", () => {
    const sheet = createSheet();
    const connection = expectOk(
      sheetEdits.connection.add(sheet, {
        a: { kind: "sheet-port", portId: "port-a" },
        b: { kind: "sheet-port", portId: "port-b" },
        signalName: "joint-enable",
      }),
    ).data;

    const result = expectOk(
      sheetEdits.connection.splitIntoLabels(sheet, connection.id, {
        firstLabelPosition: { x: 100, y: 200 },
        secondLabelPosition: { x: 240, y: 200 },
      }),
    );

    expect(result.data.labelName).toBe("joint-enable");
    expect(sheet.directConnections).toHaveLength(0);
    expect(sheet.labels).toHaveLength(2);
    expect(sheet.labels.every((label) => label.name === "joint-enable")).toBe(
      true,
    );
    expect(sheet.labelAnchors).toHaveLength(2);
  });
});
