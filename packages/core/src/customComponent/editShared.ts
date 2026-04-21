import { err, ok, type Result } from "neverthrow";
import type { NotFoundFailure, UnsupportedFailure } from "../result";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentParamDefinition,
  ComponentPinDefinition,
  NoHALProject,
} from "../types";
import { findManualComponent } from "./shared";

export type CustomComponentFailure = NotFoundFailure<"custom-component">;
export type PinFailure = NotFoundFailure<"pin">;
export type ParamFailure = NotFoundFailure<"param">;
export type FunctionFailure = NotFoundFailure<"function">;
export type InvalidRuntimeFailure = UnsupportedFailure<"invalid-runtime">;

export function requireCustomComponent(
  project: NoHALProject,
  componentId: string,
): Result<ComponentDefinition, CustomComponentFailure> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  return ok(component);
}

export function requirePin(
  component: ComponentDefinition,
  pinKey: string,
): Result<ComponentPinDefinition, PinFailure> {
  const pin = component.pins.find((candidate) => candidate.key === pinKey);
  if (!pin) return err({ code: "not-found", detail: "pin" });
  return ok(pin);
}

export function requireParam(
  component: ComponentDefinition,
  paramKey: string,
): Result<ComponentParamDefinition, ParamFailure> {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  return ok(param);
}

export function requireFunction(
  component: ComponentDefinition,
  functionKey: string,
): Result<ComponentFunctionDefinition, FunctionFailure> {
  const fn = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  if (!fn) return err({ code: "not-found", detail: "function" });
  return ok(fn);
}
