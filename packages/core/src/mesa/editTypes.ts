import type { Result } from "neverthrow";
import type { Change, Failure } from "../result";
import type {
  ProjectMesaDb25CardAssignment,
  ProjectMesaGpioDirection,
  ProjectMesaSmartSerialAssignment,
  ProjectMesaSmartSerialTarget,
} from "./types";

export type MesaHostError = Failure<"not-found", "mesa-host">;
export type MesaConnectorNotFoundError = Failure<"not-found", "mesa-connector">;
export type SmartSerialPortNotFoundError = Failure<
  "not-found",
  "smart-serial-port"
>;
export type SmartSerialAssignmentNotFoundError = Failure<
  "not-found",
  "smart-serial-assignment"
>;
export type RawGpioAssignmentNotFoundError = Failure<
  "not-found",
  "raw-gpio-assignment"
>;
export type FixedCardKindError = Failure<"forbidden", "fixed-card-kind">;
export type ConnectorCardUnsupportedError = Failure<
  "unsupported",
  "connector-card"
>;
export type RawGpioUnsupportedError = Failure<"unsupported", "raw-gpio">;
export type SmartSerialChannelError = Failure<
  "invalid-input",
  "smart-serial-channel"
>;
export type ProcessDataModeError = Failure<
  "invalid-input",
  "process-data-mode"
>;
export type PinIndexError = Failure<"invalid-input", "pin-index">;
export type SmartSerialCardError = Failure<
  "invalid-input",
  "smart-serial-card"
>;

export type MesaSmartSerialPortError =
  | SmartSerialPortNotFoundError
  | FixedCardKindError;

export type ValidateMesaSmartSerialTargetError =
  | MesaSmartSerialPortError
  | SmartSerialChannelError;

export type SetMesaSmartSerialProcessDataModeError =
  | MesaHostError
  | SmartSerialAssignmentNotFoundError
  | ProcessDataModeError;

export type SetMesaRawGpioPinDirectionError =
  | MesaHostError
  | RawGpioAssignmentNotFoundError
  | PinIndexError;

export type SetMesaSmartSerialProcessDataModeResult = Result<
  Change<number>,
  SetMesaSmartSerialProcessDataModeError
>;

export type SetMesaRawGpioPinDirectionResult = Result<
  Change<ProjectMesaGpioDirection>,
  SetMesaRawGpioPinDirectionError
>;

export interface SetMesaConnectorCardChange {
  connectorKey: string;
  assignment: ProjectMesaDb25CardAssignment | null;
}

export type SetMesaConnectorCardError =
  | MesaHostError
  | MesaConnectorNotFoundError
  | ConnectorCardUnsupportedError
  | RawGpioUnsupportedError;

export type SetMesaConnectorCardResult = Result<
  Change<SetMesaConnectorCardChange>,
  SetMesaConnectorCardError
>;

export interface SetMesaSmartSerialCardChange {
  target: ProjectMesaSmartSerialTarget;
  assignment: ProjectMesaSmartSerialAssignment | null;
}

export type SetMesaSmartSerialCardError =
  | MesaHostError
  | MesaSmartSerialPortError
  | SmartSerialChannelError
  | SmartSerialCardError;

export type SetMesaSmartSerialCardResult = Result<
  Change<SetMesaSmartSerialCardChange>,
  SetMesaSmartSerialCardError
>;
