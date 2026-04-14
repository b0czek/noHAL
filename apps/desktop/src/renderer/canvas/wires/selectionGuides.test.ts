import { createEmptyProject } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import { getRelatedLocalLabels } from "./selectionGuides";

describe("label selection guides", () => {
  it("returns matching local labels for a selected local label", () => {
    const project = createEmptyProject("Label Guide Fixture");
    const sheet = project.sheets[project.rootSheetId];

    sheet.labels.push(
      {
        id: "label_selected",
        name: "sig_a",
        scope: "local",
        position: { x: 40, y: 60 },
      },
      {
        id: "label_peer_one",
        name: "sig_a",
        scope: "local",
        position: { x: 180, y: 60 },
      },
      {
        id: "label_peer_two",
        name: "sig_a",
        scope: "local",
        position: { x: 320, y: 60 },
      },
      {
        id: "label_other_name",
        name: "sig_b",
        scope: "local",
        position: { x: 460, y: 60 },
      },
      {
        id: "label_global",
        name: "sig_a",
        scope: "global",
        position: { x: 600, y: 60 },
      },
    );

    expect(
      getRelatedLocalLabels(sheet, { kind: "label", id: "label_selected" }).map(
        (label) => label.id,
      ),
    ).toEqual(["label_peer_one", "label_peer_two"]);
  });

  it("returns no guides for non-label selections", () => {
    const project = createEmptyProject("Label Guide Fixture");
    const sheet = project.sheets[project.rootSheetId];

    sheet.labels.push({
      id: "label_selected",
      name: "sig_a",
      scope: "local",
      position: { x: 40, y: 60 },
    });

    expect(
      getRelatedLocalLabels(sheet, { kind: "node", id: "node_component" }),
    ).toEqual([]);
  });

  it("returns no guides for selected global labels", () => {
    const project = createEmptyProject("Label Guide Fixture");
    const sheet = project.sheets[project.rootSheetId];

    sheet.labels.push(
      {
        id: "label_selected",
        name: "sig_a",
        scope: "global",
        position: { x: 40, y: 60 },
      },
      {
        id: "label_peer",
        name: "sig_a",
        scope: "global",
        position: { x: 180, y: 60 },
      },
    );

    expect(
      getRelatedLocalLabels(sheet, { kind: "label", id: "label_selected" }),
    ).toEqual([]);
  });
});
