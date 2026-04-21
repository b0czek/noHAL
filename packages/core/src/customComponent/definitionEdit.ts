import { err, ok } from "neverthrow";
import type { ChangeResult, EmptyNameFailure } from "../result";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentParamDefinition,
  ComponentPinDefinition,
  HalValueType,
  PinDirection,
} from "../types";
import {
  type FunctionFailure,
  type InvalidRuntimeFailure,
  type ParamFailure,
  type PinFailure,
  requireFunction,
  requireParam,
  requirePin,
} from "./editShared";
import {
  createCustomComponentFunction,
  createCustomComponentParam,
  createCustomComponentPin,
  nextUniqueMemberKey,
} from "./shared";

function normalizeMaxInstances(
  maxInstances: number | undefined,
): number | undefined {
  if (!Number.isFinite(maxInstances)) return undefined;
  const normalized = Math.trunc(maxInstances ?? 0);
  return normalized > 0 ? normalized : undefined;
}

function updateHalComponentName(
  component: ComponentDefinition,
  halComponentName: string,
): ChangeResult<ComponentDefinition, EmptyNameFailure> {
  const normalized = halComponentName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (component.halComponentName === normalized) {
    return ok({ data: component, changed: false });
  }
  component.halComponentName = normalized;
  component.name = normalized;
  return ok({ data: component, changed: true });
}

function updateRuntimeKind(
  component: ComponentDefinition,
  runtimeKind: "rt" | "userspace" | "unknown",
): ChangeResult<ComponentDefinition> {
  if ((component.runtime?.kind ?? "unknown") === runtimeKind) {
    return ok({ data: component, changed: false });
  }
  component.runtime = {
    ...(component.runtime ?? { kind: runtimeKind }),
    kind: runtimeKind,
  };
  return ok({ data: component, changed: true });
}

function updateLoadCommand(
  component: ComponentDefinition,
  loadCommand: string,
): ChangeResult<ComponentDefinition> {
  const normalized = loadCommand.trim();
  if ((component.loadCommand ?? "").trim() === normalized) {
    return ok({ data: component, changed: false });
  }
  if (normalized) component.loadCommand = normalized;
  else delete component.loadCommand;
  return ok({ data: component, changed: true });
}

function updateMaxInstances(
  component: ComponentDefinition,
  maxInstances: number | undefined,
): ChangeResult<ComponentDefinition> {
  const normalized = normalizeMaxInstances(maxInstances);
  const existing = component.runtime?.instanceNaming?.maxInstances;

  if (existing === normalized) {
    return ok({ data: component, changed: false });
  }

  component.runtime ??= { kind: "unknown" };

  if (normalized !== undefined) {
    component.runtime.instanceNaming = {
      ...(component.runtime.instanceNaming ?? { strategy: "free" }),
      maxInstances: normalized,
    };
  } else if (component.runtime.instanceNaming) {
    delete component.runtime.instanceNaming.maxInstances;

    if (component.runtime.instanceNaming.strategy === "free") {
      delete component.runtime.instanceNaming;
    }
  }

  return ok({ data: component, changed: true });
}

function addPin(
  component: ComponentDefinition,
): ChangeResult<ComponentPinDefinition> {
  const pin = createCustomComponentPin(component);
  component.pins.push(pin);
  return ok({ data: pin, changed: true });
}

function removePin(
  component: ComponentDefinition,
  pinKey: string,
): ChangeResult<ComponentPinDefinition, PinFailure> {
  const pinResult = requirePin(component, pinKey);
  if (pinResult.isErr()) return err(pinResult.error);
  const pin = pinResult.value;
  component.pins = component.pins.filter(
    (candidate) => candidate.key !== pinKey,
  );
  return ok({ data: pin, changed: true });
}

function updatePinName(
  component: ComponentDefinition,
  pinKey: string,
  pinName: string,
): ChangeResult<ComponentPinDefinition, PinFailure | EmptyNameFailure> {
  const pinResult = requirePin(component, pinKey);
  if (pinResult.isErr()) return err(pinResult.error);
  const pin = pinResult.value;
  const normalized = pinName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (pin.name === normalized) {
    return ok({ data: pin, changed: false });
  }
  pin.name = normalized;
  return ok({ data: pin, changed: true });
}

function updatePinType(
  component: ComponentDefinition,
  pinKey: string,
  pinType: HalValueType,
): ChangeResult<ComponentPinDefinition, PinFailure> {
  const pinResult = requirePin(component, pinKey);
  if (pinResult.isErr()) return err(pinResult.error);
  const pin = pinResult.value;
  if (pin.type === pinType) {
    return ok({ data: pin, changed: false });
  }
  pin.type = pinType;
  return ok({ data: pin, changed: true });
}

function updatePinDirection(
  component: ComponentDefinition,
  pinKey: string,
  direction: PinDirection,
): ChangeResult<ComponentPinDefinition, PinFailure> {
  const pinResult = requirePin(component, pinKey);
  if (pinResult.isErr()) return err(pinResult.error);
  const pin = pinResult.value;
  if (pin.direction === direction) {
    return ok({ data: pin, changed: false });
  }
  pin.direction = direction;
  return ok({ data: pin, changed: true });
}

function addParam(
  component: ComponentDefinition,
): ChangeResult<ComponentParamDefinition> {
  const param = createCustomComponentParam(component);
  component.params.push(param);
  return ok({ data: param, changed: true });
}

function addFunction(
  component: ComponentDefinition,
): ChangeResult<ComponentFunctionDefinition, InvalidRuntimeFailure> {
  if (component.runtime?.kind !== "rt") {
    return err({ code: "unsupported", detail: "invalid-runtime" });
  }
  const fn = createCustomComponentFunction(component);
  component.functions ??= [];
  component.functions.push(fn);
  return ok({ data: fn, changed: true });
}

function removeFunction(
  component: ComponentDefinition,
  functionKey: string,
): ChangeResult<ComponentFunctionDefinition, FunctionFailure> {
  const fnResult = requireFunction(component, functionKey);
  if (fnResult.isErr()) return err(fnResult.error);
  const fn = fnResult.value;
  component.functions = component.functions?.filter(
    (candidate) => candidate.key !== functionKey,
  );
  if (component.functions && component.functions.length === 0) {
    delete component.functions;
  }
  return ok({ data: fn, changed: true });
}

function updateFunctionName(
  component: ComponentDefinition,
  functionKey: string,
  functionName: string,
): ChangeResult<
  ComponentFunctionDefinition,
  FunctionFailure | EmptyNameFailure
> {
  const fnResult = requireFunction(component, functionKey);
  if (fnResult.isErr()) return err(fnResult.error);
  const fn = fnResult.value;
  const normalized = functionName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (fn.declaredName === normalized) {
    return ok({ data: fn, changed: false });
  }
  fn.declaredName = normalized;
  fn.halSuffix = normalized === "_" ? "" : normalized;
  fn.key = nextUniqueMemberKey(
    normalized === "_" ? "default" : normalized,
    (component.functions ?? [])
      .filter((candidate) => candidate.key !== functionKey)
      .map((candidate) => candidate.key),
    "function",
  );
  return ok({ data: fn, changed: true });
}

function updateFunctionFloatMode(
  component: ComponentDefinition,
  functionKey: string,
  floatMode: ComponentFunctionDefinition["floatMode"],
): ChangeResult<ComponentFunctionDefinition, FunctionFailure> {
  const fnResult = requireFunction(component, functionKey);
  if (fnResult.isErr()) return err(fnResult.error);
  const fn = fnResult.value;
  if (fn.floatMode === floatMode) {
    return ok({ data: fn, changed: false });
  }
  fn.floatMode = floatMode;
  return ok({ data: fn, changed: true });
}

function removeParam(
  component: ComponentDefinition,
  paramKey: string,
): ChangeResult<ComponentParamDefinition, ParamFailure> {
  const paramResult = requireParam(component, paramKey);
  if (paramResult.isErr()) return err(paramResult.error);
  const param = paramResult.value;
  component.params = component.params.filter(
    (candidate) => candidate.key !== paramKey,
  );
  return ok({ data: param, changed: true });
}

function updateParamName(
  component: ComponentDefinition,
  paramKey: string,
  paramName: string,
): ChangeResult<ComponentParamDefinition, ParamFailure | EmptyNameFailure> {
  const paramResult = requireParam(component, paramKey);
  if (paramResult.isErr()) return err(paramResult.error);
  const param = paramResult.value;
  const normalized = paramName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (param.name === normalized) {
    return ok({ data: param, changed: false });
  }
  param.name = normalized;
  return ok({ data: param, changed: true });
}

function updateParamType(
  component: ComponentDefinition,
  paramKey: string,
  paramType: ComponentParamDefinition["type"],
): ChangeResult<ComponentParamDefinition, ParamFailure> {
  const paramResult = requireParam(component, paramKey);
  if (paramResult.isErr()) return err(paramResult.error);
  const param = paramResult.value;
  if (param.type === paramType) {
    return ok({ data: param, changed: false });
  }
  param.type = paramType;
  return ok({ data: param, changed: true });
}

function updateParamDirection(
  component: ComponentDefinition,
  paramKey: string,
  paramDirection: ComponentParamDefinition["direction"],
): ChangeResult<ComponentParamDefinition, ParamFailure> {
  const paramResult = requireParam(component, paramKey);
  if (paramResult.isErr()) return err(paramResult.error);
  const param = paramResult.value;
  if (param.direction === paramDirection) {
    return ok({ data: param, changed: false });
  }
  param.direction = paramDirection;
  return ok({ data: param, changed: true });
}

function updateParamDefaultValue(
  component: ComponentDefinition,
  paramKey: string,
  defaultValue: string,
): ChangeResult<ComponentParamDefinition, ParamFailure> {
  const paramResult = requireParam(component, paramKey);
  if (paramResult.isErr()) return err(paramResult.error);
  const param = paramResult.value;
  const existingDefaultValue = param.defaultValue ?? "";
  if (existingDefaultValue === defaultValue) {
    return ok({ data: param, changed: false });
  }
  if (defaultValue.trim()) param.defaultValue = defaultValue;
  else delete param.defaultValue;
  return ok({ data: param, changed: true });
}

export const customComponentDefinitionEdits = {
  halComponentName: {
    update: updateHalComponentName,
  },
  runtimeKind: {
    update: updateRuntimeKind,
  },
  loadCommand: {
    update: updateLoadCommand,
  },
  maxInstances: {
    update: updateMaxInstances,
  },
  pin: {
    add: addPin,
    remove: removePin,
    name: {
      update: updatePinName,
    },
    type: {
      update: updatePinType,
    },
    direction: {
      update: updatePinDirection,
    },
  },
  param: {
    add: addParam,
    remove: removeParam,
    name: {
      update: updateParamName,
    },
    type: {
      update: updateParamType,
    },
    direction: {
      update: updateParamDirection,
    },
    defaultValue: {
      update: updateParamDefaultValue,
    },
  },
  function: {
    add: addFunction,
    remove: removeFunction,
    name: {
      update: updateFunctionName,
    },
    floatMode: {
      update: updateFunctionFloatMode,
    },
  },
} as const;
