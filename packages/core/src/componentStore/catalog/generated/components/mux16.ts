import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "mux16",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:mux16:mux16",
        name: "mux16",
        halComponentName: "mux16",
        source: "comp",
        sourcePath: "src/hal/components/mux16.comp",
        docs: {
          component: "Select from one of sixteen input values",
          license: "GPL",
        },
        pins: [
          {
            key: "use_graycode",
            name: "use-graycode",
            type: "bit",
            doc: "\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n",
            direction: "in",
          },
          {
            key: "suppress_no_input",
            name: "suppress-no-input",
            type: "bit",
            doc: "\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavaliable.\n",
            direction: "in",
          },
          {
            key: "debounce_time",
            name: "debounce-time",
            type: "float",
            doc: "\\\nsets debouce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore 'noisy' switches.\n",
            direction: "in",
          },
          {
            key: "selidx",
            name: "sel#",
            type: "bit",
            doc: "\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n",
            arrayLen: 4,
            direction: "in",
          },
          {
            key: "out_f",
            name: "out-f",
            type: "float",
            direction: "out",
          },
          {
            key: "out_s",
            name: "out-s",
            type: "s32",
            doc: "\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the four \\\\fBsel\\\\fR values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n.RS\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\netc.\n.RE\n",
            direction: "out",
          },
          {
            key: "inidxidx",
            name: "in##",
            type: "float",
            doc: "array of selectable outputs",
            arrayLen: 16,
            direction: "in",
          },
        ],
        params: [
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal debounce timer\n for debugging.",
            direction: "r",
          },
          {
            key: "selected",
            name: "selected",
            type: "s32",
            doc: "Current value of the internal selection variable after conversion\n for debugging",
            direction: "r",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component mux16 "Select from one of sixteen input values";\npin in bit use_graycode"""\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n""";\npin in bit suppress_no_input"""\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavaliable.\n""";\npin in float debounce_time"""\\\nsets debouce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore \'noisy\' switches.\n""";\npin in bit sel#[4] """\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n""";\npin out float out_f;\npin out s32 out_s """\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the four \\\\fBsel\\\\fR values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n.RS\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\netc.\n.RE\n""";\nparam r float elapsed "Current value of the internal debounce timer\\n for debugging.";\nparam r s32 selected "Current value of the internal selection variable after conversion\\n for debugging";\npin in float in##[16] "array of selectable outputs";\nvariable double delaytime;\nvariable int lastnum;\nvariable int running;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:mux16:mux16",
        name: "mux16",
        halComponentName: "mux16",
        source: "comp",
        sourcePath: "src/hal/components/mux16.comp",
        docs: {
          component: "Select from one of sixteen input values",
          license: "GPL",
          author: "Chris S Morley",
          seeAlso: "mux2(9), mux4(9), mux8(9), mux_generic(9).",
        },
        pins: [
          {
            key: "use_graycode",
            name: "use-graycode",
            type: "bit",
            doc: "\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n",
            direction: "in",
          },
          {
            key: "suppress_no_input",
            name: "suppress-no-input",
            type: "bit",
            doc: "\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavailable.\n",
            direction: "in",
          },
          {
            key: "debounce_time",
            name: "debounce-time",
            type: "float",
            doc: "\\\nsets debounce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore 'noisy' switches.\n",
            direction: "in",
          },
          {
            key: "selidx",
            name: "sel#",
            type: "bit",
            doc: "\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n",
            arrayLen: 4,
            direction: "in",
          },
          {
            key: "out_f",
            name: "out-f",
            type: "float",
            direction: "out",
          },
          {
            key: "out_s",
            name: "out-s",
            type: "s32",
            doc: "\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the four \\\\fBsel\\\\fR values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n.RS\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\netc.\n.RE\n",
            direction: "out",
          },
          {
            key: "inidxidx",
            name: "in##",
            type: "float",
            doc: "array of selectable outputs",
            arrayLen: 16,
            direction: "in",
          },
        ],
        params: [
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal debounce timer\n for debugging.",
            direction: "r",
          },
          {
            key: "selected",
            name: "selected",
            type: "s32",
            doc: "Current value of the internal selection variable after conversion\n for debugging",
            direction: "r",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component mux16 "Select from one of sixteen input values";\npin in bit use_graycode"""\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n""";\npin in bit suppress_no_input"""\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavailable.\n""";\npin in float debounce_time"""\\\nsets debounce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore \'noisy\' switches.\n""";\npin in bit sel#[4] """\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n""";\npin out float out_f;\npin out s32 out_s """\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the four \\\\fBsel\\\\fR values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n.RS\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel3=FALSE\\\\fR, \\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\netc.\n.RE\n""";\nparam r float elapsed "Current value of the internal debounce timer\\n for debugging.";\nparam r s32 selected "Current value of the internal selection variable after conversion\\n for debugging";\npin in float in##[16] "array of selectable outputs";\nvariable double delaytime;\nvariable int lastnum;\nvariable int running;\nfunction _;\nlicense "GPL";\nauthor "Chris S Morley";\nsee_also "mux2(9), mux4(9), mux8(9), mux_generic(9).";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:mux16:mux16",
        name: "mux16",
        halComponentName: "mux16",
        source: "comp",
        sourcePath: "src/hal/components/mux16.comp",
        docs: {
          component: "Select from one of sixteen input values",
          license: "GPL",
          author: "Chris S Morley",
          seeAlso: "mux2(9), mux4(9), mux8(9), mux_generic(9).",
        },
        pins: [
          {
            key: "use_graycode",
            name: "use-graycode",
            type: "bit",
            doc: "\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n",
            direction: "in",
          },
          {
            key: "suppress_no_input",
            name: "suppress-no-input",
            type: "bit",
            doc: "\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavailable.\n",
            direction: "in",
          },
          {
            key: "debounce_time",
            name: "debounce-time",
            type: "float",
            doc: "\\\nsets debounce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore 'noisy' switches.\n",
            direction: "in",
          },
          {
            key: "selidx",
            name: "sel#",
            type: "bit",
            doc: "\\\nTogether, these determine which **in**__N__ value is copied to *out*.\n",
            arrayLen: 4,
            direction: "in",
          },
          {
            key: "out_f",
            name: "out-f",
            type: "float",
            direction: "out",
          },
          {
            key: "out_s",
            name: "out-s",
            type: "s32",
            doc: '\\\nFollows the value of one of the **in**__N__ values according to the four *sel* values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n\n[cols="^1,^1,^1,^1,1"]\n|===\n^h|sel3\n^h|sel2\n^h|sel1\n^h|sel0\n^h|out follows\n\n|0|0|0|0|*in00*\n|0|0|0|1|*in01*\n|0|0|1|0|*in02*\n|0|0|1|1|*in03*\n|0|1|0|0|*in04*\n|0|1|0|1|*in05*\n|0|1|1|0|*in06*\n|0|1|1|1|*in07*\n|1|0|0|0|*in08*\n|1|0|0|1|*in09*\n|1|0|1|0|*in10*\n|1|0|1|1|*in11*\n|1|1|0|0|*in12*\n|1|1|0|1|*in13*\n|1|1|1|0|*in14*\n|1|1|1|1|*in15*\n|===\n\n',
            direction: "out",
          },
          {
            key: "inidxidx",
            name: "in##",
            type: "float",
            doc: "array of selectable outputs",
            arrayLen: 16,
            direction: "in",
          },
        ],
        params: [
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal debounce timer for debugging.",
            direction: "r",
          },
          {
            key: "selected",
            name: "selected",
            type: "s32",
            doc: "Current value of the internal selection variable after conversion for debugging",
            direction: "r",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component mux16 "Select from one of sixteen input values";\npin in bit use_graycode"""\\\nThis signifies the input will use Gray code instead of binary.\nGray code is a good choice when using physical switches because\nfor each increment only one select input changes at a time.\n""";\npin in bit suppress_no_input"""\\\nThis suppresses changing the output if all select lines are false.\nThis stops unwanted jumps in output between transitions of input.\nbut make in00 unavailable.\n""";\npin in float debounce_time"""\\\nsets debounce time in seconds.  eg. .10 = a tenth of a second\ninput must be stable this long before outputs changes. This\nhelps to ignore \'noisy\' switches.\n""";\npin in bit sel#[4] """\\\nTogether, these determine which **in**__N__ value is copied to *out*.\n""";\npin out float out_f;\npin out s32 out_s """\\\nFollows the value of one of the **in**__N__ values according to the four *sel* values\nand whether use-graycode is active.\nThe s32 value will be trunuated and limited to the max and min values of signed values. \n\n[cols="^1,^1,^1,^1,1"]\n|===\n^h|sel3\n^h|sel2\n^h|sel1\n^h|sel0\n^h|out follows\n\n|0|0|0|0|*in00*\n|0|0|0|1|*in01*\n|0|0|1|0|*in02*\n|0|0|1|1|*in03*\n|0|1|0|0|*in04*\n|0|1|0|1|*in05*\n|0|1|1|0|*in06*\n|0|1|1|1|*in07*\n|1|0|0|0|*in08*\n|1|0|0|1|*in09*\n|1|0|1|0|*in10*\n|1|0|1|1|*in11*\n|1|1|0|0|*in12*\n|1|1|0|1|*in13*\n|1|1|1|0|*in14*\n|1|1|1|1|*in15*\n|===\n\n""";\nparam r float elapsed "Current value of the internal debounce timer for debugging.";\nparam r s32 selected "Current value of the internal selection variable after conversion for debugging";\npin in float in##[16] "array of selectable outputs";\nvariable double delaytime;\nvariable int lastnum;\nvariable int running;\nfunction _;\nlicense "GPL";\nauthor "Chris S Morley";\nsee_also "mux2(9), mux4(9), mux8(9), mux_generic(9).";\n',
        },
      },
    },
  ],
};

export default history;
