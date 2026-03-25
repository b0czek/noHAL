import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "../halExport";
import { createEmptyProject, reconcileProject } from "../project";
import { addMesaHost, updateMesaHostIp } from "./edit";

describe("Mesa DPLL support", () => {
  it("projects host DPLL pins onto the Mesa host component", () => {
    const project = createEmptyProject("Mesa DPLL");
    const hostId = addMesaHost(project, "7i92t");

    updateMesaHostIp(project, hostId, "192.168.1.121");
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
          key: "dpll_timer_us_01",
          name: "dpll.01.timer-us",
          direction: "in",
          type: "float",
        }),
        expect.objectContaining({
          key: "dpll_timer_us_04",
          name: "dpll.04.timer-us",
          direction: "in",
          type: "float",
        }),
        expect.objectContaining({
          key: "dpll_base_freq_khz",
          name: "dpll.base-freq-khz",
          direction: "in",
          type: "float",
        }),
        expect.objectContaining({
          key: "dpll_phase_error_us",
          name: "dpll.phase-error-us",
          direction: "out",
          type: "float",
        }),
        expect.objectContaining({
          key: "dpll_time_const",
          name: "dpll.time-const",
          direction: "in",
          type: "u32",
        }),
        expect.objectContaining({
          key: "dpll_plimit",
          name: "dpll.plimit",
          direction: "in",
          type: "u32",
        }),
        expect.objectContaining({
          key: "dpll_ddsize",
          name: "dpll.ddsize",
          direction: "out",
          type: "u32",
        }),
        expect.objectContaining({
          key: "dpll_prescale",
          name: "dpll.prescale",
          direction: "in",
          type: "u32",
        }),
      ]),
    );
  });

  it("requests the HostMot2 DPLL module in the runtime config", () => {
    const project = createEmptyProject("Mesa DPLL Export");
    const hostId = addMesaHost(project, "7i92t");

    updateMesaHostIp(project, hostId, "192.168.1.121");

    const { text } = exportProjectToHal(project);

    expect(text).toContain('config="driver=7i92t instance=0 num_dplls=1"');
  });
});
