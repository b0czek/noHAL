import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "../halExport";
import { createEmptyProject, reconcileProject } from "../project";
import { expectErr, expectOk } from "../testUtils/result";
import {
  addMesaHost,
  setMesaConnectorCard,
  setMesaRawGpioPinDirection,
  updateMesaHostIp,
} from "./edit";
import { MESA_RAW_GPIO_CARD_KIND } from "./types";

const FIRST_RAW_GPIO_PIN_INDEX = 1;
const SECOND_RAW_GPIO_OUTPUT_PIN_INDEX = 4;
const OUT_OF_RANGE_RAW_GPIO_PIN_INDEX = 17;

function makeRawGpioProject() {
  const project = createEmptyProject("Mesa Raw GPIO");
  const hostId = expectOk(addMesaHost(project, "7i92t")).data;
  expectOk(updateMesaHostIp(project, hostId, "192.168.1.121"));
  expectOk(
    setMesaConnectorCard(project, hostId, "p2", MESA_RAW_GPIO_CARD_KIND),
  );
  expectOk(
    setMesaRawGpioPinDirection(
      project,
      hostId,
      "p2",
      FIRST_RAW_GPIO_PIN_INDEX,
      "output",
    ),
  );
  expectOk(
    setMesaRawGpioPinDirection(
      project,
      hostId,
      "p2",
      SECOND_RAW_GPIO_OUTPUT_PIN_INDEX,
      "output",
    ),
  );
  return project;
}

describe("Mesa raw GPIO support", () => {
  it("stores per-pin raw GPIO output selection on the connector assignment", () => {
    const project = createEmptyProject("Mesa Raw GPIO Edit");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expectOk(
      setMesaConnectorCard(project, hostId, "p2", MESA_RAW_GPIO_CARD_KIND),
    );

    expect(
      expectOk(setMesaRawGpioPinDirection(project, hostId, "p2", 1, "output"))
        .changed,
    ).toBe(true);
    expect(
      project.mesa?.hosts[0]?.connectors?.find(
        (item) => item.connectorKey === "p2",
      )?.rawGpio?.outputPins,
    ).toEqual([1]);

    expect(
      expectOk(setMesaRawGpioPinDirection(project, hostId, "p2", 1, "input"))
        .changed,
    ).toBe(true);
    expect(
      project.mesa?.hosts[0]?.connectors?.find(
        (item) => item.connectorKey === "p2",
      )?.rawGpio?.outputPins,
    ).toEqual([]);
  });

  it("projects raw GPIO pins onto the Mesa host component using per-pin direction", () => {
    const project = makeRawGpioProject();

    reconcileProject(project);

    const hostComponent = Object.values(project.library.components).find(
      (component) =>
        component.system?.manager === "mesa" &&
        component.system?.family === "host",
    );

    expect(hostComponent).toBeDefined();
    expect(hostComponent?.pins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "gpio_017",
          name: "gpio.017.in",
          direction: "out",
        }),
        expect.objectContaining({
          key: "gpio_017_not",
          name: "gpio.017.in_not",
          direction: "out",
        }),
        expect.objectContaining({
          key: "gpio_018",
          name: "gpio.018.out",
          direction: "in",
        }),
        expect.objectContaining({
          key: "gpio_021",
          name: "gpio.021.out",
          direction: "in",
        }),
      ]),
    );
    expect(hostComponent?.pins.some((pin) => pin.name === "gpio.018.in")).toBe(
      false,
    );
    expect(
      hostComponent?.pins.some((pin) => pin.name === "gpio.018.in_not"),
    ).toBe(false);
  });

  it("emits HostMot2 raw GPIO output configuration as setp lines", () => {
    const project = makeRawGpioProject();

    const { text } = exportProjectToHal(project);

    expect(text).toContain("setp hm2_7i92t.0.gpio.018.is_output 1");
    expect(text).toContain("setp hm2_7i92t.0.gpio.021.is_output 1");
    expect(text).not.toContain("setp hm2_7i92t.0.gpio.017.is_output 1");
  });

  it("rejects raw GPIO pins outside the connector range", () => {
    const project = createEmptyProject("Mesa Raw GPIO Invalid Pin");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expectOk(
      setMesaConnectorCard(project, hostId, "p2", MESA_RAW_GPIO_CARD_KIND),
    );

    expect(
      expectErr(
        setMesaRawGpioPinDirection(
          project,
          hostId,
          "p2",
          OUT_OF_RANGE_RAW_GPIO_PIN_INDEX,
          "output",
        ),
      ),
    ).toEqual({
      code: "invalid-input",
      detail: "pin-index",
    });
  });
});
