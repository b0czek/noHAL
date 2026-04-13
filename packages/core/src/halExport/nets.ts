import { unique } from "remeda";
import { isValidHalName } from "../halNames";
import type { EndpointRecord, ExportContext } from "./context";
import { pushFatal } from "./context";
import {
  chooseNetName,
  describeEndpointForWarning,
  formatNetLine,
  sortPinsForHal,
} from "./naming";

export interface NetLines {
  mainNetLines: string[];
  postguiNetLines: string[];
}

export function collectNetLines(ctx: ExportContext): NetLines {
  const groups = ctx.union.groups();
  const mainNetLines: string[] = [];
  const postguiNetLines: string[] = [];
  let autoIndex = 1;

  for (const groupMembers of groups.values()) {
    const records = groupMembers
      .map((id) => ctx.endpoints.get(id))
      .filter((item): item is EndpointRecord => Boolean(item));

    const leafPins = records.filter(
      (r) => r.kind === "component-pin" && r.halPinPath,
    );
    if (leafPins.length < 2) continue;

    const hints = groupMembers.flatMap(
      (id) => ctx.hintsByEndpointId.get(id) ?? [],
    );
    const fallbackNetName = `auto_net_${autoIndex}`;
    const candidateNetName = chooseNetName(hints, autoIndex);
    const netName = isValidHalName(candidateNetName)
      ? candidateNetName
      : fallbackNetName;
    if (netName !== candidateNetName) {
      ctx.warnings.push(
        `Invalid HAL signal name '${candidateNetName}'; using fallback '${fallbackNetName}'`,
      );
    }
    autoIndex += 1;

    const outputs = leafPins.filter((r) => r.direction === "out");
    if (outputs.length > 1) {
      pushFatal(
        ctx,
        `Multiple output pins share one signal on net '${netName}': ${outputs.map((r) => r.halPinPath).join(", ")}`,
      );
      continue;
    }
    const ios = leafPins.filter((r) => r.direction === "io");
    if (outputs.length > 0 && ios.length > 0) {
      pushFatal(
        ctx,
        `HAL signal '${netName}' mixes OUT and IO pins: ${[...outputs, ...ios]
          .map((r) => r.halPinPath)
          .join(", ")}`,
      );
      continue;
    }

    const types = new Set(records.map((r) => r.type));
    if (types.size > 1) {
      const endpointDetails = records
        .map(describeEndpointForWarning)
        .sort()
        .join(", ");
      pushFatal(
        ctx,
        `Mixed signal types found during export on net '${netName}': ${Array.from(types).join(", ")}. Endpoints: ${endpointDetails}`,
      );
      continue;
    }

    const sortedLeafs = sortPinsForHal(leafPins);
    const pinPaths = sortedLeafs
      .map((r) => r.halPinPath)
      .filter((v): v is string => Boolean(v));
    const invalidPinPaths = pinPaths.filter((path) => !isValidHalName(path));
    if (invalidPinPaths.length > 0) {
      pushFatal(
        ctx,
        `Skipping net '${netName}' with invalid HAL pin paths: ${invalidPinPaths.join(", ")}`,
      );
      continue;
    }
    const mainPinPaths = unique(
      sortedLeafs
        .filter((record) => record.exportStage !== "postgui")
        .map((record) => record.halPinPath)
        .filter((path): path is string => Boolean(path)),
    );
    const postguiPinPaths = unique(
      sortedLeafs
        .filter((record) => record.exportStage === "postgui")
        .map((record) => record.halPinPath)
        .filter((path): path is string => Boolean(path)),
    );
    if (mainPinPaths.length > 0) {
      mainNetLines.push(formatNetLine(netName, mainPinPaths));
    }
    if (postguiPinPaths.length > 0) {
      postguiNetLines.push(formatNetLine(netName, postguiPinPaths));
    }
  }

  return { mainNetLines, postguiNetLines };
}
