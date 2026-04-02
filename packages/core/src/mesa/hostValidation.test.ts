import { describe, expect, it } from "vitest";
import { createMesaHostIpValidator } from "./hostValidation";

describe("createMesaHostIpValidator", () => {
  it("trims valid IPv4 addresses without emitting issues", () => {
    const validateHostIp = createMesaHostIpValidator();

    expect(validateHostIp("host-1", "Mesa 7i92T", " 192.168.1.121 ")).toEqual({
      ip: "192.168.1.121",
      issues: [],
    });
  });

  it("reports a missing IP address", () => {
    const validateHostIp = createMesaHostIpValidator();

    expect(validateHostIp("host-1", "Mesa 7i92T", "   ")).toEqual({
      ip: "",
      issues: [
        {
          severity: "fatal",
          message: "Mesa 7i92T is missing an IP address.",
          hostId: "host-1",
        },
      ],
    });
  });

  it("reports duplicate IP addresses across validations", () => {
    const validateHostIp = createMesaHostIpValidator();

    expect(validateHostIp("host-1", "Mesa A", "192.168.1.121").issues).toEqual(
      [],
    );
    expect(validateHostIp("host-2", "Mesa B", "192.168.1.121")).toEqual({
      ip: "192.168.1.121",
      issues: [
        {
          severity: "fatal",
          message: "Mesa host IP '192.168.1.121' is duplicated.",
          hostId: "host-2",
        },
      ],
    });
  });

  it("reports invalid non-IPv4 host IP values", () => {
    const validateHostIp = createMesaHostIpValidator();

    expect(validateHostIp("host-1", "Mesa 7i92T", "not a valid ip")).toEqual({
      ip: "not a valid ip",
      issues: [
        {
          severity: "fatal",
          message: "Mesa host IP 'not a valid ip' is not a valid IPv4 address.",
          hostId: "host-1",
        },
      ],
    });
  });
});
