import { describe, expect, it } from "vitest";
import { createEmptyProject, reconcileProject } from "../project";
import { expectOk } from "../testUtils/result";
import { deriveMesaTopology } from "./derive";
import {
  addMesaHost,
  setMesaConnectorCard,
  setMesaSmartSerialCard,
  setMesaSmartSerialProcessDataMode,
  updateMesaHostIp,
} from "./edit";

const SEVEN_I77_MPG_MODE = 3;

describe("Mesa process data modes", () => {
  it("projects 7i77 mode 2 analog inputs onto channel 0 and exports the selected sserial mode", () => {
    const project = createEmptyProject("Mesa 7i77 mode 2");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expectOk(updateMesaHostIp(project, hostId, "10.10.10.10"));
    expectOk(setMesaConnectorCard(project, hostId, "p1", "7i77"));
    expectOk(
      setMesaSmartSerialProcessDataMode(
        project,
        hostId,
        { connectorKey: "p1", portKey: "io", channel: 0 },
        2,
      ),
    );
    expectOk(
      setMesaSmartSerialCard(
        project,
        hostId,
        { connectorKey: "p1", portKey: "rs422", channel: 0 },
        "7i84",
      ),
    );

    const topology = deriveMesaTopology(project.mesa ?? { hosts: [] });

    expect(topology.hostRuntimes[0]?.configString).toContain(
      "sserial_port_0=200",
    );

    reconcileProject(project);

    const ioComponent = Object.values(project.library.components).find(
      (component) =>
        component.constraints?.fixedInstanceName === "hm2_7i92t.0.7i77.0.0",
    );
    const analogComponent = Object.values(project.library.components).find(
      (component) =>
        component.constraints?.fixedInstanceName === "hm2_7i92t.0.7i77.0.1",
    );

    expect(ioComponent).toBeDefined();
    expect(ioComponent?.pins.some((pin) => pin.name === "analogin0")).toBe(
      true,
    );
    expect(ioComponent?.pins.some((pin) => pin.name === "fieldvoltage")).toBe(
      true,
    );
    expect(ioComponent?.pins.some((pin) => pin.name === "analogin.00")).toBe(
      false,
    );
    expect(analogComponent?.pins.some((pin) => pin.name === "analogout0")).toBe(
      true,
    );
  });

  it("projects 7i77 mode 3 MPGs as local counter pins instead of generic encoder modules", () => {
    const project = createEmptyProject("Mesa 7i77 mode 3");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expectOk(updateMesaHostIp(project, hostId, "10.10.10.10"));
    expectOk(setMesaConnectorCard(project, hostId, "p1", "7i77"));
    expectOk(
      setMesaSmartSerialProcessDataMode(
        project,
        hostId,
        { connectorKey: "p1", portKey: "io", channel: 0 },
        SEVEN_I77_MPG_MODE,
      ),
    );
    expectOk(
      setMesaSmartSerialCard(
        project,
        hostId,
        { connectorKey: "p1", portKey: "rs422", channel: 0 },
        "7i84",
      ),
    );

    const topology = deriveMesaTopology(project.mesa ?? { hosts: [] });

    expect(topology.hostRuntimes[0]?.configString).toContain(
      `sserial_port_0=${SEVEN_I77_MPG_MODE}00`,
    );

    reconcileProject(project);

    const ioComponent = Object.values(project.library.components).find(
      (component) =>
        component.constraints?.fixedInstanceName === "hm2_7i92t.0.7i77.0.0",
    );

    expect(ioComponent).toBeDefined();
    expect(ioComponent?.pins.some((pin) => pin.name === "enc0.count")).toBe(
      true,
    );
    expect(ioComponent?.pins.some((pin) => pin.name === "enc1.count")).toBe(
      true,
    );
    expect(
      ioComponent?.pins.some((pin) => pin.name === "encoder.00.position"),
    ).toBe(false);
  });
});
