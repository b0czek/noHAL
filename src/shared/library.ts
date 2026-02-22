import type { ComponentDefinition } from "./types";

function logicGate(name: string, op: string): ComponentDefinition {
  return {
    id: `builtin:${name}`,
    name,
    halComponentName: name,
    source: "manual",
    runtime: { kind: "rt" },
    pins: [
      { key: "in0", name: "in0", direction: "in", type: "bit" },
      { key: "in1", name: "in1", direction: "in", type: "bit" },
      { key: "out", name: "out", direction: "out", type: "bit" }
    ],
    params: [],
    docs: {
      component: `${name} (builtin metadata)`,
      description: `${op} logic gate (builtin placeholder metadata)`
    }
  };
}

export function createBuiltinLibrary(): Record<string, ComponentDefinition> {
  const items: ComponentDefinition[] = [
    logicGate("and2", "AND"),
    logicGate("or2", "OR"),
    {
      id: "builtin:not",
      name: "not",
      halComponentName: "not",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [
        { key: "in", name: "in", direction: "in", type: "bit" },
        { key: "out", name: "out", direction: "out", type: "bit" }
      ],
      params: []
    },
    {
      id: "builtin:sum2",
      name: "sum2",
      halComponentName: "sum2",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [
        { key: "in0", name: "in0", direction: "in", type: "float" },
        { key: "in1", name: "in1", direction: "in", type: "float" },
        { key: "out", name: "out", direction: "out", type: "float" }
      ],
      params: []
    },
    {
      id: "builtin:siggen",
      name: "siggen",
      halComponentName: "siggen",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [
        { key: "enable", name: "enable", direction: "in", type: "bit" },
        { key: "square", name: "square", direction: "out", type: "float" },
        { key: "sine", name: "sine", direction: "out", type: "float" }
      ],
      params: [
        { key: "frequency", name: "frequency", direction: "rw", type: "float" },
        { key: "amplitude", name: "amplitude", direction: "rw", type: "float" }
      ]
    }
  ];

  return Object.fromEntries(items.map((item) => [item.id, item]));
}
