import type {
  ChangeResult,
  ForbiddenFailure,
  InvalidInputFailure,
  NotFoundFailure,
  UnsupportedFailure,
} from "../result";
import type {
  ProjectMesaDb25CardAssignment,
  ProjectMesaGpioDirection,
  ProjectMesaSmartSerialAssignment,
  ProjectMesaSmartSerialTarget,
} from "./types";

export type MesaHostFailure = NotFoundFailure<"mesa-host">;
export type MesaConnectorNotFoundFailure = NotFoundFailure<"mesa-connector">;
export type SmartSerialPortNotFoundFailure = NotFoundFailure<"smart-serial-port">;
export type SmartSerialAssignmentNotFoundFailure =
  NotFoundFailure<"smart-serial-assignment">;
export type RawGpioAssignmentNotFoundFailure =
  NotFoundFailure<"raw-gpio-assignment">;
export type FixedCardKindFailure = ForbiddenFailure<"fixed-card-kind">;
export type ConnectorCardUnsupportedFailure =
  UnsupportedFailure<"connector-card">;
export type RawGpioUnsupportedFailure = UnsupportedFailure<"raw-gpio">;
export type SmartSerialChannelFailure =
  InvalidInputFailure<"smart-serial-channel">;
export type ProcessDataModeFailure = InvalidInputFailure<"process-data-mode">;
export type PinIndexFailure = InvalidInputFailure<"pin-index">;
export type SmartSerialCardFailure = InvalidInputFailure<"smart-serial-card">;

export type MesaSmartSerialPortFailure =
  | SmartSerialPortNotFoundFailure
  | FixedCardKindFailure;

export type ValidateMesaSmartSerialTargetFailure =
  | MesaSmartSerialPortFailure
  | SmartSerialChannelFailure;

export type SetMesaSmartSerialProcessDataModeFailure =
  | MesaHostFailure
  | SmartSerialAssignmentNotFoundFailure
  | ProcessDataModeFailure;

export type SetMesaRawGpioPinDirectionFailure =
  | MesaHostFailure
  | RawGpioAssignmentNotFoundFailure
  | PinIndexFailure;

export type SetMesaSmartSerialProcessDataModeResult = ChangeResult<
  number,
  SetMesaSmartSerialProcessDataModeFailure
>;

export type SetMesaRawGpioPinDirectionResult = ChangeResult<
  ProjectMesaGpioDirection,
  SetMesaRawGpioPinDirectionFailure
>;

export interface SetMesaConnectorCardChange {
  connectorKey: string;
  assignment: ProjectMesaDb25CardAssignment | null;
}

export type SetMesaConnectorCardFailure =
  | MesaHostFailure
  | MesaConnectorNotFoundFailure
  | ConnectorCardUnsupportedFailure
  | RawGpioUnsupportedFailure;

export type SetMesaConnectorCardResult = ChangeResult<
  SetMesaConnectorCardChange,
  SetMesaConnectorCardFailure
>;

export interface SetMesaSmartSerialCardChange {
  target: ProjectMesaSmartSerialTarget;
  assignment: ProjectMesaSmartSerialAssignment | null;
}

export type SetMesaSmartSerialCardFailure =
  | MesaHostFailure
  | MesaSmartSerialPortFailure
  | SmartSerialChannelFailure
  | SmartSerialCardFailure;

export type SetMesaSmartSerialCardResult = ChangeResult<
  SetMesaSmartSerialCardChange,
  SetMesaSmartSerialCardFailure
>;
