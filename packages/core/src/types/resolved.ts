import type { HalValueType, PinDirection, PortSide } from "./base";
import type { SheetEndpointRef } from "./sheet";

export interface ResolvedPin {
  key: string;
  name: string;
  direction: PinDirection;
  type: HalValueType;
  side: PortSide;
  doc?: string;
}

export interface ResolvedEndpoint {
  endpoint: SheetEndpointRef;
  name: string;
  direction: PinDirection;
  type: HalValueType;
  side: PortSide;
}
