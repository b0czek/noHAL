import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "flipflop",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:flipflop:flipflop",
        name: "flipflop",
        halComponentName: "flipflop",
        source: "comp",
        sourcePath: "src/hal/components/flipflop.comp",
        docs: {
          component: "D type flip-flop",
          license: "GPL",
        },
        pins: [
          {
            key: "data",
            name: "data",
            type: "bit",
            doc: "data input",
            direction: "in",
          },
          {
            key: "clk",
            name: "clk",
            type: "bit",
            doc: "clock, rising edge writes data to out",
            direction: "in",
          },
          {
            key: "set",
            name: "set",
            type: "bit",
            doc: "when true, force out true",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "when true, force out false; overrides set",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "output",
            direction: "io",
          },
        ],
        params: [],
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
            data: "flipflop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component flipflop "D type flip-flop";\npin in bit data_ "data input";\npin in bit clk "clock, rising edge writes data to out";\npin in bit set "when true, force out true";\npin in bit reset "when true, force out false; overrides set";\npin io bit out "output";\noption data flipflop_data;\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:flipflop:flipflop",
        name: "flipflop",
        halComponentName: "flipflop",
        source: "comp",
        sourcePath: "src/hal/components/flipflop.comp",
        docs: {
          component: "D type flip-flop",
          license: "GPL",
        },
        pins: [
          {
            key: "data",
            name: "data",
            type: "bit",
            doc: "data input",
            direction: "in",
          },
          {
            key: "clk",
            name: "clk",
            type: "bit",
            doc: "clock, rising edge writes data to out",
            direction: "in",
          },
          {
            key: "set",
            name: "set",
            type: "bit",
            doc: "when true, force out true",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "when true, force out false; overrides set",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "output",
            direction: "io",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "inverted output",
            direction: "io",
          },
        ],
        params: [],
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
            data: "flipflop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component flipflop "D type flip-flop";\npin in bit data_ "data input";\npin in bit clk "clock, rising edge writes data to out";\npin in bit set "when true, force out true";\npin in bit reset "when true, force out false; overrides set";\npin io bit out "output";\npin io bit out-not "inverted output";\noption data flipflop_data;\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:flipflop:flipflop",
        name: "flipflop",
        halComponentName: "flipflop",
        source: "comp",
        sourcePath: "src/hal/components/flipflop.comp",
        docs: {
          component: "D type flip-flop",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "data",
            name: "data",
            type: "bit",
            doc: "data input",
            direction: "in",
          },
          {
            key: "clk",
            name: "clk",
            type: "bit",
            doc: "clock, rising edge writes data to out",
            direction: "in",
          },
          {
            key: "set",
            name: "set",
            type: "bit",
            doc: "when true, force out true",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "when true, force out false; overrides set",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "output",
            direction: "io",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "inverted output",
            direction: "io",
          },
        ],
        params: [],
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
            data: "flipflop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component flipflop "D type flip-flop";\npin in bit data_ "data input";\npin in bit clk "clock, rising edge writes data to out";\npin in bit set "when true, force out true";\npin in bit reset "when true, force out false; overrides set";\npin io bit out "output";\npin io bit out-not "inverted output";\noption data flipflop_data;\n\nfunction _ nofp;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:flipflop:flipflop",
        name: "flipflop",
        halComponentName: "flipflop",
        source: "comp",
        sourcePath: "src/hal/components/flipflop.comp",
        docs: {
          component: "D type flip-flop",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "data",
            name: "data",
            type: "bit",
            doc: "data input",
            direction: "in",
          },
          {
            key: "clk",
            name: "clk",
            type: "bit",
            doc: "clock, rising edge writes data to out",
            direction: "in",
          },
          {
            key: "set",
            name: "set",
            type: "bit",
            doc: "when true, force out true",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "when true, force out false; overrides set",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "output",
            direction: "io",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "inverted output",
            direction: "io",
          },
        ],
        params: [],
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
            data: "flipflop_data",
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component flipflop "D type flip-flop";\npin in bit data_ "data input";\npin in bit clk "clock, rising edge writes data to out";\npin in bit set "when true, force out true";\npin in bit reset "when true, force out false; overrides set";\npin io bit out "output";\npin io bit out-not "inverted output";\noption data flipflop_data;\n\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
