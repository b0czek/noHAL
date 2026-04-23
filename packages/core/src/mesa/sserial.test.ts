import { describe, expect, it } from "vitest";
import { createEmptyProject, reconcileProject } from "../project";
import { expectErr, expectOk } from "../testUtils/result";
import {
  addMesaHost,
  setMesaConnectorCard,
  setMesaSmartSerialCard,
  updateMesaHostIp,
} from "./edit";

function reconcileSmartSerialComponent(cardKind: "7i66-8" | "7i66-24") {
  const project = createEmptyProject(`Mesa ${cardKind}`);
  const hostId = expectOk(addMesaHost(project, "7i92t")).data;

  expectOk(updateMesaHostIp(project, hostId, "192.168.1.121"));
  expectOk(setMesaConnectorCard(project, hostId, "p1", "7i77"));
  expectOk(
    setMesaSmartSerialCard(
      project,
      hostId,
      { connectorKey: "p1", portKey: "rs422", channel: 0 },
      cardKind,
    ),
  );

  reconcileProject(project);

  return Object.values(project.library.components).find(
    (component) =>
      component.system?.manager === "mesa" &&
      component.system?.family === "sserial" &&
      component.constraints?.fixedInstanceName === "hm2_7i92t.0.7i66.0.2",
  );
}

describe("Mesa smart-serial HAL projection", () => {
  it.each([
    "7i66-8",
    "7i66-24",
  ] as const)("projects %s into HAL as 7i66 while preserving the variant in the GUI name", (cardKind) => {
    const component = reconcileSmartSerialComponent(cardKind);

    expect(component).toBeDefined();
    expect(component?.name).toContain(cardKind);
    expect(component?.constraints?.fixedInstanceName).toBe(
      "hm2_7i92t.0.7i66.0.2",
    );
  });

  it("rejects smart-serial channels outside the port range", () => {
    const project = createEmptyProject("Mesa Invalid Smart Serial Channel");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expectOk(updateMesaHostIp(project, hostId, "192.168.1.121"));
    expectOk(setMesaConnectorCard(project, hostId, "p1", "7i77"));

    expect(
      expectErr(
        setMesaSmartSerialCard(
          project,
          hostId,
          { connectorKey: "p1", portKey: "rs422", channel: 1 },
          "7i66-8",
        ),
      ),
    ).toEqual({
      code: "invalid-input",
      cause: "smart-serial-target",
      detail: "smart-serial-channel",
    });
  });
});
