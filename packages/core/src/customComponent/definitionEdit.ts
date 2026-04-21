import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentParamDefinition,
  ComponentPinDefinition,
} from "../types";
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
): boolean {
  const normalized = halComponentName.trim();
  if (!normalized || component.halComponentName === normalized) return false;
  component.halComponentName = normalized;
  component.name = normalized;
  return true;
}

function updateRuntimeKind(
  component: ComponentDefinition,
  runtimeKind: "rt" | "userspace" | "unknown",
): boolean {
  if ((component.runtime?.kind ?? "unknown") === runtimeKind) return false;
  component.runtime = {
    ...(component.runtime ?? { kind: runtimeKind }),
    kind: runtimeKind,
  };
  return true;
}

function updateLoadCommand(
  component: ComponentDefinition,
  loadCommand: string,
): boolean {
  const normalized = loadCommand.trim();
  if ((component.loadCommand ?? "").trim() === normalized) return false;
  if (normalized) component.loadCommand = normalized;
  else delete component.loadCommand;
  return true;
}

function updateMaxInstances(
  component: ComponentDefinition,
  maxInstances: number | undefined,
): boolean {
  const normalized = normalizeMaxInstances(maxInstances);
  const existing = component.runtime?.instanceNaming?.maxInstances;

  if (existing === normalized) return false;

  component.runtime ??= { kind: "unknown" };

  if (normalized !== undefined) {
    // Keep any existing naming mode and only apply the placement limit.
    component.runtime.instanceNaming = {
      ...(component.runtime.instanceNaming ?? { strategy: "free" }),
      maxInstances: normalized,
    };
  } else if (component.runtime.instanceNaming) {
    delete component.runtime.instanceNaming.maxInstances;

    // Drop the helper object once it no longer carries any custom state.
    if (component.runtime.instanceNaming.strategy === "free") {
      delete component.runtime.instanceNaming;
    }
  }

  return true;
}

function addPin(component: ComponentDefinition): ComponentPinDefinition {
  const pin = createCustomComponentPin(component);
  component.pins.push(pin);
  return pin;
}

function removePin(
  component: ComponentDefinition,
  pinKey: string,
): ComponentPinDefinition | null {
  const pin = component.pins.find((candidate) => candidate.key === pinKey);
  if (!pin) return null;
  component.pins = component.pins.filter(
    (candidate) => candidate.key !== pinKey,
  );
  return pin;
}

function updatePinName(
  component: ComponentDefinition,
  pinKey: string,
  pinName: string,
): ComponentPinDefinition | null {
  const pin = component.pins.find((candidate) => candidate.key === pinKey);
  const normalized = pinName.trim();
  if (!pin || !normalized) return null;
  pin.name = normalized;
  return pin;
}

function updatePinType(
  component: ComponentDefinition,
  pinKey: string,
  pinType: ComponentPinDefinition["type"],
): ComponentPinDefinition | null {
  const pin = component.pins.find((candidate) => candidate.key === pinKey);
  if (!pin) return null;
  pin.type = pinType;
  return pin;
}

function updatePinDirection(
  component: ComponentDefinition,
  pinKey: string,
  direction: ComponentPinDefinition["direction"],
): ComponentPinDefinition | null {
  const pin = component.pins.find((candidate) => candidate.key === pinKey);
  if (!pin) return null;
  pin.direction = direction;
  return pin;
}

function addParam(component: ComponentDefinition): ComponentParamDefinition {
  const param = createCustomComponentParam(component);
  component.params.push(param);
  return param;
}

function addFunction(
  component: ComponentDefinition,
): ComponentFunctionDefinition | null {
  if (component.runtime?.kind !== "rt") return null;
  const fn = createCustomComponentFunction(component);
  component.functions ??= [];
  component.functions.push(fn);
  return fn;
}

function removeFunction(
  component: ComponentDefinition,
  functionKey: string,
): ComponentFunctionDefinition | null {
  const fn = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  if (!fn) return null;
  component.functions = component.functions?.filter(
    (candidate) => candidate.key !== functionKey,
  );
  if (component.functions && component.functions.length === 0) {
    delete component.functions;
  }
  return fn;
}

function updateFunctionName(
  component: ComponentDefinition,
  functionKey: string,
  functionName: string,
): ComponentFunctionDefinition | null {
  const fn = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  const normalized = functionName.trim();
  if (!fn || !normalized) return null;
  fn.declaredName = normalized;
  fn.halSuffix = normalized === "_" ? "" : normalized;
  fn.key = nextUniqueMemberKey(
    normalized === "_" ? "default" : normalized,
    (component.functions ?? [])
      .filter((candidate) => candidate.key !== functionKey)
      .map((candidate) => candidate.key),
    "function",
  );
  return fn;
}

function updateFunctionFloatMode(
  component: ComponentDefinition,
  functionKey: string,
  floatMode: ComponentFunctionDefinition["floatMode"],
): ComponentFunctionDefinition | null {
  const fn = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  if (!fn) return null;
  fn.floatMode = floatMode;
  return fn;
}

function removeParam(
  component: ComponentDefinition,
  paramKey: string,
): ComponentParamDefinition | null {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!param) return null;
  component.params = component.params.filter(
    (candidate) => candidate.key !== paramKey,
  );
  return param;
}

function updateParamName(
  component: ComponentDefinition,
  paramKey: string,
  paramName: string,
): ComponentParamDefinition | null {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  const normalized = paramName.trim();
  if (!param || !normalized) return null;
  param.name = normalized;
  return param;
}

function updateParamType(
  component: ComponentDefinition,
  paramKey: string,
  paramType: ComponentParamDefinition["type"],
): ComponentParamDefinition | null {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!param) return null;
  param.type = paramType;
  return param;
}

function updateParamDirection(
  component: ComponentDefinition,
  paramKey: string,
  paramDirection: ComponentParamDefinition["direction"],
): ComponentParamDefinition | null {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!param) return null;
  param.direction = paramDirection;
  return param;
}

function updateParamDefaultValue(
  component: ComponentDefinition,
  paramKey: string,
  defaultValue: string,
): ComponentParamDefinition | null {
  const param = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!param) return null;
  if (defaultValue.trim()) param.defaultValue = defaultValue;
  else delete param.defaultValue;
  return param;
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
