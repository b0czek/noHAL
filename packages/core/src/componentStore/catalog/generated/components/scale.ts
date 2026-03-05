import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "scale",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:scale:scale",
        name: "scale",
        halComponentName: "scale",
        source: "comp",
        sourcePath: "src/hal/components/scale.comp",
        docs: {
          component:
            "LinuxCNC HAL component that applies a scale and offset to its input",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            direction: "in",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in * gain + offset",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component scale "LinuxCNC HAL component that applies a scale and offset to its input";\npin in float in;\npin in float gain;\npin in float offset;\npin out float out "out = in * gain + offset";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:scale:scale",
        name: "scale",
        halComponentName: "scale",
        source: "comp",
        sourcePath: "src/hal/components/scale.comp",
        docs: {
          component:
            "LinuxCNC HAL component that applies a scale and offset to its input",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            direction: "in",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in * gain + offset",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component scale "LinuxCNC HAL component that applies a scale and offset to its input";\npin in float in;\npin in float gain;\npin in float offset;\npin out float out "out = in * gain + offset";\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:scale:scale",
        name: "scale",
        halComponentName: "scale",
        source: "comp",
        sourcePath: "src/hal/components/scale.comp",
        docs: {
          component:
            "LinuxCNC HAL component that applies a scale and offset to its input",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            direction: "in",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in * gain + offset",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component scale "LinuxCNC HAL component that applies a scale and offset to its input";\npin in float in;\npin in float gain;\npin in float offset;\npin out float out "out = in * gain + offset";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
