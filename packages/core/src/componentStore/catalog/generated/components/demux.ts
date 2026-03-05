import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "demux",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:demux:demux",
        name: "demux",
        halComponentName: "demux",
        source: "comp",
        sourcePath: "src/hal/components/demux.comp",
        docs: {
          component:
            "Select one of several output pins by integer and/or or individual bits.",
          description:
            'This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display',
          license: "GPL 2+",
          author: "andypugh",
        },
        pins: [
          {
            key: "sel_bit_idxidx",
            name: "sel-bit-##",
            type: "bit",
            doc: "Binary-number bit selectors",
            arrayLen: 5,
            direction: "in",
          },
          {
            key: "sel_u32",
            name: "sel-u32",
            type: "u32",
            doc: "Integer selection input",
            direction: "in",
          },
          {
            key: "out_idxidx",
            name: "out-##",
            type: "bit",
            doc: "The set of output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            direction: "out",
          },
        ],
        params: [
          {
            key: "bargraph",
            name: "bargraph",
            type: "bit",
            defaultValue: "0",
            direction: "rw",
          },
        ],
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
            default_personality: 32,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component demux "Select one of several output pins by integer and/or or individual bits.";\n\ndescription """This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display""";\n\npin in bit sel-bit-## [5] "Binary-number bit selectors";\npin in unsigned sel-u32 "Integer selection input";\npin out bit out-## [32:personality] "The set of output bits";\n\noption default_personality 32;\nparam rw bit bargraph = 0;\n\nlicense "GPL 2+";\nauthor "andypugh";\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:demux:demux",
        name: "demux",
        halComponentName: "demux",
        source: "comp",
        sourcePath: "src/hal/components/demux.comp",
        docs: {
          component:
            "Select one of several output pins by integer and/or or individual bits.",
          description:
            'This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display.',
          seeAlso: "\\fBselect8\\fR(9)",
          license: "GPL 2+",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "sel_bit_idxidx",
            name: "sel-bit-##",
            type: "bit",
            doc: "Binary-number bit selectors",
            arrayLen: 5,
            direction: "in",
          },
          {
            key: "sel_u32",
            name: "sel-u32",
            type: "u32",
            doc: "Integer selection input",
            direction: "in",
          },
          {
            key: "out_idxidx",
            name: "out-##",
            type: "bit",
            doc: "The set of output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            direction: "out",
          },
        ],
        params: [
          {
            key: "bargraph",
            name: "bargraph",
            type: "bit",
            defaultValue: "0",
            direction: "rw",
          },
        ],
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
            default_personality: 32,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component demux "Select one of several output pins by integer and/or or individual bits.";\n\ndescription """This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display.""";\n\npin in bit sel-bit-## [5] "Binary-number bit selectors";\npin in unsigned sel-u32 "Integer selection input";\npin out bit out-## [32:personality] "The set of output bits";\n\noption default_personality 32;\nparam rw bit bargraph = 0;\n\nsee_also "\\\\fBselect8\\\\fR(9)";\nlicense "GPL 2+";\nauthor "Andy Pugh";\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:demux:demux",
        name: "demux",
        halComponentName: "demux",
        source: "comp",
        sourcePath: "src/hal/components/demux.comp",
        docs: {
          component:
            "Select one of several output pins by integer and/or or individual bits.",
          description:
            'This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display.',
          seeAlso: "*select8*(9)",
          license: "GPL 2+",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "sel_bit_idxidx",
            name: "sel-bit-##",
            type: "bit",
            doc: "Binary-number bit selectors",
            arrayLen: 5,
            direction: "in",
          },
          {
            key: "sel_u32",
            name: "sel-u32",
            type: "u32",
            doc: "Integer selection input",
            direction: "in",
          },
          {
            key: "out_idxidx",
            name: "out-##",
            type: "bit",
            doc: "The set of output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            direction: "out",
          },
        ],
        params: [
          {
            key: "bargraph",
            name: "bargraph",
            type: "bit",
            defaultValue: "0",
            direction: "rw",
          },
        ],
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
            default_personality: 32,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component demux "Select one of several output pins by integer and/or or individual bits.";\n\ndescription """This component creates a number of output bits defined\nby the "personality" command-line parameter. One of these bits will be\nset based on interpreting the bit-inputs as a binary number and then\nadding on the integer input. Most uses will use only one\nor the other, but it is possible to use the bits as a ""shift"" if\nrequired.\nAn optional operating mode is enabled by setting the "bargraph"\nparameter to true, in this case all bits up to the selected bit will be\nset, as might be required for an LED bargraph display.""";\n\npin in bit sel-bit-## [5] "Binary-number bit selectors";\npin in unsigned sel-u32 "Integer selection input";\npin out bit out-## [32:personality] "The set of output bits";\n\noption default_personality 32;\nparam rw bit bargraph = 0;\n\nsee_also "*select8*(9)";\nlicense "GPL 2+";\nauthor "Andy Pugh";\n\noption period no;\nfunction _;\n\n',
        },
      },
    },
  ],
};

export default history;
