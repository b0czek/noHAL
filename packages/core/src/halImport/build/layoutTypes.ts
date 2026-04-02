import type { HalImportNet, PinDirection, XY } from "../../types";

export type ImportPreparedEndpoint = {
  nodeId: string;
  pinKey: string;
  pinRefKey: string;
  direction: PinDirection | undefined;
};

export type ImportPreparedNet = {
  net: HalImportNet;
  resolvedEndpoints: ImportPreparedEndpoint[];
  directConnectionEdges: Array<{
    a: ImportPreparedEndpoint;
    b: ImportPreparedEndpoint;
  }>;
};

export type ImportedLabelPositionResolver = (
  nodeId: string,
  direction: PinDirection | undefined,
  labelName: string,
  pinKey: string,
  netIndex: number,
  endpointIndex: number,
) => XY;
