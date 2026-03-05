import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "toggle",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:toggle:toggle",
        name: "toggle",
        halComponentName: "toggle",
        source: "comp",
        sourcePath: "src/hal/components/toggle.comp",
        docs: {
          component: "'push-on, push-off' from momentary pushbuttons",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "button input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "on/off output",
            direction: "io",
          },
        ],
        params: [
          {
            key: "debounce",
            name: "debounce",
            type: "u32",
            doc: "debounce delay in periods",
            defaultValue: "2",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "toggle_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component toggle "\'push-on, push-off\' from momentary pushbuttons";\npin in bit in "button input";\npin io bit out "on/off output";\nparam rw u32 debounce = 2 "debounce delay in periods";\noption data toggle_data;\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:toggle:toggle",
        name: "toggle",
        halComponentName: "toggle",
        source: "comp",
        sourcePath: "src/hal/components/toggle.comp",
        docs: {
          component: "'push-on, push-off' from momentary pushbuttons",
          description: "\n.PSPIC -L ../man/images/toggle.ps\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "button input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "on/off output",
            direction: "io",
          },
        ],
        params: [
          {
            key: "debounce",
            name: "debounce",
            type: "u32",
            doc: "debounce delay in periods",
            defaultValue: "2",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "toggle_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component toggle "\'push-on, push-off\' from momentary pushbuttons";\n\ndescription\n"""\n.PSPIC -L ../man/images/toggle.ps\n""";\n\npin in bit in "button input";\npin io bit out "on/off output";\nparam rw u32 debounce = 2 "debounce delay in periods";\noption data toggle_data;\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:toggle:toggle",
        name: "toggle",
        halComponentName: "toggle",
        source: "comp",
        sourcePath: "src/hal/components/toggle.comp",
        docs: {
          component: "'push-on, push-off' from momentary pushbuttons",
          description:
            "\n     ┐     ┌──┐        ┌──┐\n.br\nin : └─────┘  └────────┘  └──\n.br\n     ┐     ┌───────────┐\n.br\nout: └─────┘           └─────\n",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "button input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "on/off output",
            direction: "io",
          },
        ],
        params: [
          {
            key: "debounce",
            name: "debounce",
            type: "u32",
            doc: "debounce delay in periods",
            defaultValue: "2",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "toggle_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component toggle "\'push-on, push-off\' from momentary pushbuttons";\n\ndescription\n"""\n     ┐     ┌──┐        ┌──┐\n.br\nin : └─────┘  └────────┘  └──\n.br\n     ┐     ┌───────────┐\n.br\nout: └─────┘           └─────\n""";\n\npin in bit in "button input";\npin io bit out "on/off output";\nparam rw u32 debounce = 2 "debounce delay in periods";\noption data toggle_data;\n\nfunction _ nofp;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:toggle:toggle",
        name: "toggle",
        halComponentName: "toggle",
        source: "comp",
        sourcePath: "src/hal/components/toggle.comp",
        docs: {
          component: "'push-on, push-off' from momentary pushbuttons",
          description:
            "\n....\n     ┐     ┌──┐        ┌──┐\nin : └─────┘  └────────┘  └──\n\n     ┐     ┌───────────┐\nout: └─────┘           └─────\n....\n\n",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "button input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "on/off output",
            direction: "io",
          },
        ],
        params: [
          {
            key: "debounce",
            name: "debounce",
            type: "u32",
            doc: "debounce delay in periods",
            defaultValue: "2",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "toggle_data",
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component toggle "\'push-on, push-off\' from momentary pushbuttons";\n\ndescription\n"""\n....\n     ┐     ┌──┐        ┌──┐\nin : └─────┘  └────────┘  └──\n\n     ┐     ┌───────────┐\nout: └─────┘           └─────\n....\n\n""";\n\npin in bit in "button input";\npin io bit out "on/off output";\nparam rw u32 debounce = 2 "debounce delay in periods";\noption data toggle_data;\noption period no;\n\nfunction _ nofp;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
