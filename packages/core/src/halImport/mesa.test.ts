import { describe, expect, it } from "vitest";
import { createEmptyComponentStore } from "../componentStore";
import {
  addMesaHost,
  setMesaConnectorCard,
  setMesaRawGpioPinDirection,
  updateMesaHostIp,
} from "../mesa";
import { MESA_RAW_GPIO_CARD_KIND } from "../mesa/types";
import { createEmptyProject } from "../project";
import { findSystemSheet } from "../sheet";
import { buildProjectFromHalImport } from "./build";
import { detectMesaHalImport } from "./mesa";
import { parseHalImportDraft } from "./parse";

function buildMesaConfig() {
  const project = createEmptyProject("Mesa Import");
  const hostId = addMesaHost(project, "7i92t");
  updateMesaHostIp(project, hostId, "192.168.1.121");
  setMesaConnectorCard(project, hostId, "p1", "7i77");
  return project.mesa ?? { hosts: [] };
}

function buildRawGpioMesaConfig() {
  const project = createEmptyProject("Mesa Raw GPIO Import");
  const hostId = addMesaHost(project, "7i92t");
  updateMesaHostIp(project, hostId, "192.168.1.121");
  setMesaConnectorCard(project, hostId, "p2", MESA_RAW_GPIO_CARD_KIND);
  setMesaRawGpioPinDirection(project, hostId, "p2", 1, "output");
  return project.mesa ?? { hosts: [] };
}

describe("Mesa HAL import support", () => {
  it("detects Mesa hardware references in imported HAL", () => {
    const draft = parseHalImportDraft(`
      loadrt hm2_eth board_ip=192.168.1.121
      net spindle-enable motion.spindle-on => hm2_7i92t.0.7i77.0.1.spinena
    `);

    expect(detectMesaHalImport(draft)).toEqual({ detected: true });
  });

  it("routes Mesa nested HAL paths onto configured Mesa-managed nodes", () => {
    const draft = parseHalImportDraft(`
      loadrt and2 count=1
      net spindle-enable and2.0.out => hm2_7i92t.0.7i77.0.1.spinena
      net encoder-index hm2_7i92t.0.encoder.00.index-enable <=> and2.0.in0
      setp hm2_7i92t.0.encoder.00.scale 4096
      setp hm2_7i92t.0.encoder.00.index-mask TRUE
      setp hm2_7i92t.0.7i77.0.1.analogout0-maxlim 1200
      setp hm2_7i92t.0.7i77.0.1.analogout0 3.5
    `);

    const result = buildProjectFromHalImport({
      draft,
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      mesa: buildMesaConfig(),
      linuxcncVersion: "2.10",
    });

    const systemSheet = findSystemSheet(result.project);
    expect(systemSheet).toBeDefined();

    const encoderNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "hm2_7i92t.0.encoder.00",
    );
    const analogNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "hm2_7i92t.0.7i77.0.1",
    );

    expect(encoderNode).toBeDefined();
    expect(analogNode).toBeDefined();

    if (!encoderNode || encoderNode.kind !== "component") return;
    const encoderComponent =
      result.project.library.components[encoderNode.componentId];
    const scaleParam = encoderComponent?.params.find(
      (param) => param.name === "scale",
    );
    const indexMaskParam = encoderComponent?.params.find(
      (param) => param.name === "index-mask",
    );
    expect(scaleParam).toBeDefined();
    expect(indexMaskParam).toBeDefined();
    expect(encoderNode.paramValues[scaleParam?.key ?? ""]).toBe("4096");
    expect(encoderNode.paramValues[indexMaskParam?.key ?? ""]).toBe("TRUE");

    if (!analogNode || analogNode.kind !== "component") return;
    const analogComponent =
      result.project.library.components[analogNode.componentId];
    const analogOutPin = analogComponent?.pins.find(
      (pin) => pin.name === "analogout0",
    );
    const analogOutMaxLimParam = analogComponent?.params.find(
      (param) => param.name === "analogout0-maxlim",
    );

    expect(analogComponent?.system?.manager).toBe("mesa");
    expect(analogOutPin).toBeDefined();
    expect(analogOutMaxLimParam).toBeDefined();
    expect(analogNode.pinInitialValues?.[analogOutPin?.key ?? ""]).toBe("3.5");
    expect(analogNode.paramValues[analogOutMaxLimParam?.key ?? ""]).toBe(
      "1200",
    );
    expect(
      result.project.library.components["halimport:hm2_eth"],
    ).toBeUndefined();
    expect(
      result.project.sheets[result.project.rootSheetId]?.directConnections
        .length,
    ).toBeGreaterThan(0);
    expect(systemSheet?.directConnections.length).toBeGreaterThan(0);
    expect(systemSheet?.ports.length).toBeGreaterThan(0);
  });

  it("normalizes imported Mesa field naming variants before linking", () => {
    const draft = parseHalImportDraft(`
      loadrt and2 count=1
      net spindle-enable and2.0.out => hm2_7i92t.0.7i77.0.0.output-0
      net encoder-index hm2_7i92t.0.encoder.0.index_enable <=> and2.0.in0
      setp hm2_7i92t.0.encoder.0.index_mask_invert false
      setp hm2_7i92t.0.7i77.0.1.analogout0_scalemax 6000
      setp hm2_7i92t.0.7i77.0.1.analogout0 3.5
    `);

    const result = buildProjectFromHalImport({
      draft,
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      mesa: buildMesaConfig(),
      linuxcncVersion: "2.10",
    });

    expect(
      result.warnings.filter(
        (warning) =>
          warning.includes("missing node for endpoint") ||
          warning.includes("component pin") ||
          warning.includes("Ignoring setp"),
      ),
    ).toEqual([]);

    const systemSheet = findSystemSheet(result.project);
    const ioNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "hm2_7i92t.0.7i77.0.0",
    );
    const encoderNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "hm2_7i92t.0.encoder.00",
    );
    const analogNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "hm2_7i92t.0.7i77.0.1",
    );

    expect(ioNode).toBeDefined();
    expect(encoderNode).toBeDefined();
    expect(analogNode).toBeDefined();

    if (!encoderNode || encoderNode.kind !== "component") return;
    const encoderComponent =
      result.project.library.components[encoderNode.componentId];
    const indexMaskInvertParam = encoderComponent?.params.find(
      (param) => param.name === "index-mask-invert",
    );
    expect(encoderNode.paramValues[indexMaskInvertParam?.key ?? ""]).toBe(
      "false",
    );

    if (!analogNode || analogNode.kind !== "component") return;
    const analogComponent =
      result.project.library.components[analogNode.componentId];
    const analogOutPin = analogComponent?.pins.find(
      (pin) => pin.name === "analogout0",
    );
    const analogOutScaleMaxParam = analogComponent?.params.find(
      (param) => param.name === "analogout0-scalemax",
    );
    expect(analogNode.paramValues[analogOutScaleMaxParam?.key ?? ""]).toBe(
      "6000",
    );
    expect(analogNode.pinInitialValues?.[analogOutPin?.key ?? ""]).toBe("3.5");
  });

  it("routes Mesa raw GPIO host pins using configured per-pin direction", () => {
    const draft = parseHalImportDraft(`
      loadrt and2 count=1
      setp hm2_7i92t.0.gpio.018.is_output 1
      net machine-enable and2.0.out => hm2_7i92t.0.gpio.18.out
    `);

    const result = buildProjectFromHalImport({
      draft,
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      mesa: buildRawGpioMesaConfig(),
      linuxcncVersion: "2.10",
    });

    expect(
      result.warnings.filter(
        (warning) =>
          warning.includes("component pin") ||
          warning.includes("Ignoring setp"),
      ),
    ).toEqual([]);
    expect(
      result.project.sheets[result.project.rootSheetId]?.directConnections
        .length,
    ).toBeGreaterThan(0);
  });

  it("maps imported HostMot2 Mesa paths when the driver prefix differs only by letter case", () => {
    const draft = parseHalImportDraft(`
      loadrt and2 count=1
      net spindle-enable and2.0.out => hm2_7i92T.0.7i77.0.1.spinena
      net encoder-index hm2_7i92T.0.encoder.00.index-enable <=> and2.0.in0
      setp hm2_7i92T.0.7i77.0.1.analogout0 3.5
    `);

    const result = buildProjectFromHalImport({
      draft,
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      mesa: buildMesaConfig(),
      linuxcncVersion: "2.10",
    });

    expect(
      result.warnings.filter(
        (warning) =>
          warning.includes("missing node for endpoint") ||
          warning.includes("component pin") ||
          warning.includes("Ignoring setp"),
      ),
    ).toEqual([]);

    const systemSheet = findSystemSheet(result.project);
    expect(
      systemSheet?.nodes.some(
        (node) =>
          node.kind === "component" &&
          node.instanceName === "hm2_7i92t.0.encoder.00",
      ),
    ).toBe(true);
    expect(systemSheet?.directConnections.length).toBeGreaterThan(0);
    expect(systemSheet?.ports.length).toBeGreaterThan(0);
  });
});
