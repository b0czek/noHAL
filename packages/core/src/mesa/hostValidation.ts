import { isValidHalName } from "../halNames";

export interface MesaValidationIssue {
  severity: "warning" | "fatal";
  message: string;
  hostId?: string;
}

const IPV4_LIKE_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

function missingMesaHostIpIssue(
  hostId: string,
  hostDisplayName: string,
): MesaValidationIssue {
  return {
    severity: "fatal",
    message: `${hostDisplayName} is missing an IP address.`,
    hostId,
  };
}

function duplicatedMesaHostIpIssue(
  hostId: string,
  ip: string,
): MesaValidationIssue {
  return {
    severity: "fatal",
    message: `Mesa host IP '${ip}' is duplicated.`,
    hostId,
  };
}

function invalidMesaHostIpIssue(
  hostId: string,
  ip: string,
): MesaValidationIssue {
  return {
    severity: "fatal",
    message: `Mesa host IP '${ip}' is not a valid IPv4 address.`,
    hostId,
  };
}

function isMesaHostIpFormatValid(ip: string): boolean {
  if (isValidHalName(ip.replaceAll(":", "_").replaceAll("/", "_"))) {
    return true;
  }
  return IPV4_LIKE_PATTERN.test(ip);
}

export function createMesaHostIpValidator(): (
  hostId: string,
  hostDisplayName: string,
  rawIp: string,
) => { ip: string; issues: MesaValidationIssue[] } {
  const seenIps = new Map<string, string>();

  return (hostId, hostDisplayName, rawIp) => {
    const ip = rawIp.trim();
    const issues: MesaValidationIssue[] = [];

    if (!ip) {
      issues.push(missingMesaHostIpIssue(hostId, hostDisplayName));
      return { ip, issues };
    }

    const existing = seenIps.get(ip);
    if (existing) {
      issues.push(duplicatedMesaHostIpIssue(hostId, ip));
    } else {
      seenIps.set(ip, hostId);
    }

    if (!isMesaHostIpFormatValid(ip)) {
      issues.push(invalidMesaHostIpIssue(hostId, ip));
    }

    return { ip, issues };
  };
}
