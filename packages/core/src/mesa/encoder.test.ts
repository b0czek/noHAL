import { describe, expect, it } from "vitest";
import { createEmptyProject, reconcileProject } from "../project";
import { addMesaHost, setMesaConnectorCard, updateMesaHostIp } from "./edit";

const EXPECTED_ENCODER_PSEUDO_COMPONENT_COUNT = 6;

describe("Mesa encoder HAL projection", () => {
  it("projects host-facing encoders onto dedicated per-encoder pseudo-components", () => {
    const project = createEmptyProject("Mesa Encoders");
    const hostId = addMesaHost(project, "7i92t");

    updateMesaHostIp(project, hostId, "192.168.1.121");
    setMesaConnectorCard(project, hostId, "p1", "7i77");

    reconcileProject(project);

    const hostComponent = Object.values(project.library.components).find(
      (component) =>
        component.system?.manager === "mesa" &&
        component.system?.family === "host",
    );
    const encoderComponents = Object.values(project.library.components).filter(
      (component) =>
        component.system?.manager === "mesa" &&
        component.system?.family === "pseudo" &&
        component.system?.subfamily === "encoder",
    );

    expect(hostComponent).toBeDefined();
    expect(
      hostComponent?.pins.some((pin) => pin.name === "encoder.00.position"),
    ).toBe(false);

    expect(encoderComponents).toHaveLength(
      EXPECTED_ENCODER_PSEUDO_COMPONENT_COUNT,
    );
    expect(
      encoderComponents.map(
        (component) => component.constraints?.fixedInstanceName,
      ),
    ).toEqual([
      "hm2_7i92t.0.encoder.00",
      "hm2_7i92t.0.encoder.01",
      "hm2_7i92t.0.encoder.02",
      "hm2_7i92t.0.encoder.03",
      "hm2_7i92t.0.encoder.04",
      "hm2_7i92t.0.encoder.05",
    ]);
  });
});
