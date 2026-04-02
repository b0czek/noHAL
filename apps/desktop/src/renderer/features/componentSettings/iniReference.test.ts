import {
  createEmptyMachineConfig,
  createEmptyProject,
} from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import {
  buildIniReferenceSections,
  formatIniReferenceToken,
  matchIniReferenceToken,
  parseIniReferenceToken,
} from "./iniReference";

describe("iniReference helpers", () => {
  it("builds picker sections from effective machine ini entries", () => {
    const project = createEmptyProject("INI Picker");
    project.machineConfig = createEmptyMachineConfig();
    project.machineConfig.userIni.sections = [
      {
        name: "DISPLAY",
        line: 1,
        entries: [{ key: "EDITOR", value: "gmoccapy", line: 2 }],
      },
      {
        name: "TRAJ",
        line: 3,
        entries: [{ key: "COORDINATES", value: "X Y Z", line: 4 }],
      },
    ];

    const sections = buildIniReferenceSections(project);

    expect(sections).toEqual(
      expect.arrayContaining([
        {
          name: "DISPLAY",
          entries: [
            {
              key: "EDITOR",
              value: "gmoccapy",
              token: "[DISPLAY]EDITOR",
            },
          ],
        },
        {
          name: "TRAJ",
          entries: [
            {
              key: "COORDINATES",
              value: "X Y Z",
              token: "[TRAJ]COORDINATES",
            },
          ],
        },
        {
          name: "HAL",
          entries: expect.arrayContaining([
            expect.objectContaining({
              key: "HALFILE",
              token: "[HAL]HALFILE",
            }),
          ]),
        },
      ]),
    );
  });

  it("parses and matches typed ini references case-insensitively", () => {
    const parsed = parseIniReferenceToken(" [display]editor ");
    expect(parsed).toEqual({
      sectionName: "display",
      key: "editor",
      token: "[display]editor",
    });

    const matched = matchIniReferenceToken(
      [
        {
          name: "DISPLAY",
          entries: [
            {
              key: "EDITOR",
              value: "gmoccapy",
              token: formatIniReferenceToken("DISPLAY", "EDITOR"),
            },
          ],
        },
      ],
      " [display]editor ",
    );

    expect(matched).toEqual({
      sectionName: "DISPLAY",
      key: "EDITOR",
      value: "gmoccapy",
      token: "[DISPLAY]EDITOR",
    });
    expect(matchIniReferenceToken([], "123")).toBeNull();
  });
});
