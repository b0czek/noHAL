import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "logic",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:logic:logic",
        name: "logic",
        halComponentName: "logic",
        source: "comp",
        sourcePath: "src/hal/components/logic.comp",
        docs: {
          component:
            "LinuxCNC HAL component providing configurable logic functions",
          description:
            "\nGeneral `logic function' component.  Can perform `and', `or'\nand `xor' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor' (exclusive or) output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in_idxidx",
            name: "in-##",
            type: "bit",
            arrayLen: 16,
            arrayExpr: "personality & 0xff",
            direction: "in",
          },
          {
            key: "and",
            name: "and",
            type: "bit",
            direction: "out",
          },
          {
            key: "or",
            name: "or",
            type: "bit",
            direction: "out",
          },
          {
            key: "xor",
            name: "xor",
            type: "bit",
            direction: "out",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            "component logic \"LinuxCNC HAL component providing configurable logic functions\";\npin in bit in-##[16 : personality & 0xff];\npin out bit and if personality & 0x100;\npin out bit or if personality & 0x200;\npin out bit xor if personality & 0x400;\nfunction _ nofp;\ndescription \"\"\"\nGeneral `logic function' component.  Can perform `and', `or'\nand `xor' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor' (exclusive or) output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n\"\"\";\nlicense \"GPL\";\n",
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:logic:logic",
        name: "logic",
        halComponentName: "logic",
        source: "comp",
        sourcePath: "src/hal/components/logic.comp",
        docs: {
          component:
            "LinuxCNC HAL component providing configurable logic functions",
          description:
            "\nGeneral `logic function' component.  Can perform `and', `or',\n`nand', `nor' and `xor' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor' (exclusive or) output is desired\n.IP \\\\(bu\n2048 (0x800)  if the `nand' output is desired\n.IP \\\\(bu\n4096 (0x1000)  if the `nor' output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in_idxidx",
            name: "in-##",
            type: "bit",
            arrayLen: 16,
            arrayExpr: "personality & 0xff",
            direction: "in",
          },
          {
            key: "and",
            name: "and",
            type: "bit",
            direction: "out",
          },
          {
            key: "or",
            name: "or",
            type: "bit",
            direction: "out",
          },
          {
            key: "xor",
            name: "xor",
            type: "bit",
            direction: "out",
          },
          {
            key: "nand",
            name: "nand",
            type: "bit",
            direction: "out",
          },
          {
            key: "nor",
            name: "nor",
            type: "bit",
            direction: "out",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            "component logic \"LinuxCNC HAL component providing configurable logic functions\";\npin in bit in-##[16 : personality & 0xff];\npin out bit and if personality & 0x100;\npin out bit or if personality & 0x200;\npin out bit xor if personality & 0x400;\npin out bit nand if personality & 0x800;\npin out bit nor if personality & 0x1000;\nfunction _ nofp;\ndescription \"\"\"\nGeneral `logic function' component.  Can perform `and', `or',\n`nand', `nor' and `xor' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor' (exclusive or) output is desired\n.IP \\\\(bu\n2048 (0x800)  if the `nand' output is desired\n.IP \\\\(bu\n4096 (0x1000)  if the `nor' output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n\"\"\";\nlicense \"GPL\";\n",
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:logic:logic",
        name: "logic",
        halComponentName: "logic",
        source: "comp",
        sourcePath: "src/hal/components/logic.comp",
        docs: {
          component:
            "LinuxCNC HAL component providing configurable logic functions\n\n.B loadrt logic\n.B [count=N|names=name1[,name2...]]\n.B personality=0xXXXX[,0xXXXX...]\n\n.TP\n\\\\fBcount\\\\fR The number of logical gates.\n.TP\n\\\\fBnames\\\\fR The named logical gates to create.\n.TP\n\\\\fBpersonality\\\\fR Comma separated list of hexadecimal number.\nEach number defines the behaviour of the individual logic gate.  The\nlist must have the same number of personalities as the N count.\n\n",
          description:
            "\nGeneral `logic function' component.  Can perform `and', `or',\n`nand', `nor' and `xor' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor' (exclusive or) output is desired\n.IP \\\\(bu\n2048 (0x800)  if the `nand' output is desired\n.IP \\\\(bu\n4096 (0x1000)  if the `nor' output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n",
          examples:
            "\n.PP\nThis is an OR circuit connected to three different signals, two inputs\nnamed sig-in-0 and sig-in-1, and one output named sig-out.  First the\ncircuit is defined, then its function is connected to the servo real\ntime thread, last, its pins are connected to the wanted signals.\n.IP\n.nf\nloadrt logic count=1 personality=0x202\naddf logic.0 servo-thread\nnet sig-in-0 => logic.0.in-00\nnet sig-in-1 => logic.0.in-01\nnet sig-out  <= logic.0.or\n.fi\n\n.PP\nThis is a named AND circuit with two inputs and one output.\n.IP\n.nf\nloadrt logic names=both personality=0x102\naddf both servo-thread\nnet sig-in-0 => both.in-00\nnet sig-in-1 => both.in-01\nnet sig-out  <= both.and\n.fi\n\n",
          seeAlso:
            "\n\\\\fBand2\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9)\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in_idxidx",
            name: "in-##",
            type: "bit",
            arrayLen: 16,
            arrayExpr: "personality & 0xff",
            direction: "in",
          },
          {
            key: "and",
            name: "and",
            type: "bit",
            direction: "out",
          },
          {
            key: "or",
            name: "or",
            type: "bit",
            direction: "out",
          },
          {
            key: "xor",
            name: "xor",
            type: "bit",
            direction: "out",
          },
          {
            key: "nand",
            name: "nand",
            type: "bit",
            direction: "out",
          },
          {
            key: "nor",
            name: "nor",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Read the inputs and toggle the output bit.",
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
            'component logic """LinuxCNC HAL component providing configurable logic functions\n\n.B loadrt logic\n.B [count=N|names=name1[,name2...]]\n.B personality=0xXXXX[,0xXXXX...]\n\n.TP\n\\\\fBcount\\\\fR The number of logical gates.\n.TP\n\\\\fBnames\\\\fR The named logical gates to create.\n.TP\n\\\\fBpersonality\\\\fR Comma separated list of hexadecimal number.\nEach number defines the behaviour of the individual logic gate.  The\nlist must have the same number of personalities as the N count.\n\n""";\npin in bit in-##[16 : personality & 0xff];\npin out bit and if personality & 0x100;\npin out bit or if personality & 0x200;\npin out bit xor if personality & 0x400;\npin out bit nand if personality & 0x800;\npin out bit nor if personality & 0x1000;\nfunction _ nofp "Read the inputs and toggle the output bit.";\ndescription """\nGeneral `logic function\' component.  Can perform `and\', `or\',\n`nand\', `nor\' and `xor\' of up to 16 inputs.\n.LP\nDetermine the proper value for `personality\'\nby adding the inputs and outputs then convert to hex:\n.IP \\\\(bu 4\nThe number of input pins, usually from 2 to 16\n.IP \\\\(bu\n256 (0x100)  if the `and\' output is desired\n.IP \\\\(bu\n512 (0x200)  if the `or\' output is desired\n.IP \\\\(bu\n1024 (0x400)  if the `xor\' (exclusive or) output is desired\n.IP \\\\(bu\n2048 (0x800)  if the `nand\' output is desired\n.IP \\\\(bu\n4096 (0x1000)  if the `nor\' output is desired\n.LP\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor\' and `and\' outputs.\n""";\nexamples """\n.PP\nThis is an OR circuit connected to three different signals, two inputs\nnamed sig-in-0 and sig-in-1, and one output named sig-out.  First the\ncircuit is defined, then its function is connected to the servo real\ntime thread, last, its pins are connected to the wanted signals.\n.IP\n.nf\nloadrt logic count=1 personality=0x202\naddf logic.0 servo-thread\nnet sig-in-0 => logic.0.in-00\nnet sig-in-1 => logic.0.in-01\nnet sig-out  <= logic.0.or\n.fi\n\n.PP\nThis is a named AND circuit with two inputs and one output.\n.IP\n.nf\nloadrt logic names=both personality=0x102\naddf both servo-thread\nnet sig-in-0 => both.in-00\nnet sig-in-1 => both.in-01\nnet sig-out  <= both.and\n.fi\n\n""";\nsee_also """\n\\\\fBand2\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9)\n""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:logic:logic",
        name: "logic",
        halComponentName: "logic",
        source: "comp",
        sourcePath: "src/hal/components/logic.comp",
        docs: {
          component:
            "LinuxCNC HAL component providing configurable logic functions\n\n*loadrt* *logic* [*count*=_N_|*names*=_name1_[,_name2_...]] *personality*=_0xXXXX_[,_0xXXXX_...]\n\n*count*::\nThe number of logical gates.\n\n*names*::\nThe named logical gates to create.\n\n*personality*:: Comma separated list of hexadecimal number.\nEach number defines the behaviour of the individual logic gate.  The\nlist must have the same number of personalities as the N count.\n\n",
          description:
            "\nGeneral `logic function' component.  Can perform `and', `or',\n`nand', `nor' and `xor' of up to 16 inputs.\n\nDetermine the proper value for `personality'\nby adding the inputs and outputs then convert to hex:\n\n* The number of input pins, usually from 2 to 16\n* 256 (0x100)  if the `and' output is desired\n* 512 (0x200)  if the `or' output is desired\n* 1024 (0x400)  if the `xor' (exclusive or) output is desired\n* 2048 (0x800)  if the `nand' output is desired\n* 4096 (0x1000)  if the `nor' output is desired\n\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor' and `and' outputs.\n",
          examples:
            "\n\nThis is an OR circuit connected to three different signals, two inputs\nnamed sig-in-0 and sig-in-1, and one output named sig-out.  First the\ncircuit is defined, then its function is connected to the servo real\ntime thread, last, its pins are connected to the wanted signals.\n\n[source,hal]\n----\nloadrt logic count=1 personality=0x202\naddf logic.0 servo-thread\nnet sig-in-0 => logic.0.in-00\nnet sig-in-1 => logic.0.in-01\nnet sig-out  <= logic.0.or\n----\n\nThis is a named AND circuit with two inputs and one output.\n\n[source,hal]\n----\nloadrt logic names=both personality=0x102\naddf both servo-thread\nnet sig-in-0 => both.in-00\nnet sig-in-1 => both.in-01\nnet sig-out  <= both.and\n----\n\n",
          seeAlso:
            "\n*and2*(9),\n*lut5*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9)\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in_idxidx",
            name: "in-##",
            type: "bit",
            arrayLen: 16,
            arrayExpr: "personality & 0xff",
            direction: "in",
          },
          {
            key: "and",
            name: "and",
            type: "bit",
            direction: "out",
          },
          {
            key: "or",
            name: "or",
            type: "bit",
            direction: "out",
          },
          {
            key: "xor",
            name: "xor",
            type: "bit",
            direction: "out",
          },
          {
            key: "nand",
            name: "nand",
            type: "bit",
            direction: "out",
          },
          {
            key: "nor",
            name: "nor",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Read the inputs and toggle the output bit.",
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
            'component logic """LinuxCNC HAL component providing configurable logic functions\n\n*loadrt* *logic* [*count*=_N_|*names*=_name1_[,_name2_...]] *personality*=_0xXXXX_[,_0xXXXX_...]\n\n*count*::\nThe number of logical gates.\n\n*names*::\nThe named logical gates to create.\n\n*personality*:: Comma separated list of hexadecimal number.\nEach number defines the behaviour of the individual logic gate.  The\nlist must have the same number of personalities as the N count.\n\n""";\npin in bit in-##[16 : personality & 0xff];\npin out bit and if personality & 0x100;\npin out bit or if personality & 0x200;\npin out bit xor if personality & 0x400;\npin out bit nand if personality & 0x800;\npin out bit nor if personality & 0x1000;\nfunction _ nofp "Read the inputs and toggle the output bit.";\ndescription """\nGeneral `logic function\' component.  Can perform `and\', `or\',\n`nand\', `nor\' and `xor\' of up to 16 inputs.\n\nDetermine the proper value for `personality\'\nby adding the inputs and outputs then convert to hex:\n\n* The number of input pins, usually from 2 to 16\n* 256 (0x100)  if the `and\' output is desired\n* 512 (0x200)  if the `or\' output is desired\n* 1024 (0x400)  if the `xor\' (exclusive or) output is desired\n* 2048 (0x800)  if the `nand\' output is desired\n* 4096 (0x1000)  if the `nor\' output is desired\n\nOutputs can be combined, for example 2 + 256 + 1024 = 1282 converted to hex\nwould be 0x502 and would have two inputs and have both `xor\' and `and\' outputs.\n""";\nexamples """\n\nThis is an OR circuit connected to three different signals, two inputs\nnamed sig-in-0 and sig-in-1, and one output named sig-out.  First the\ncircuit is defined, then its function is connected to the servo real\ntime thread, last, its pins are connected to the wanted signals.\n\n[source,hal]\n----\nloadrt logic count=1 personality=0x202\naddf logic.0 servo-thread\nnet sig-in-0 => logic.0.in-00\nnet sig-in-1 => logic.0.in-01\nnet sig-out  <= logic.0.or\n----\n\nThis is a named AND circuit with two inputs and one output.\n\n[source,hal]\n----\nloadrt logic names=both personality=0x102\naddf both servo-thread\nnet sig-in-0 => both.in-00\nnet sig-in-1 => both.in-01\nnet sig-out  <= both.and\n----\n\n""";\nsee_also """\n*and2*(9),\n*lut5*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9)\n""";\nlicense "GPL";\nauthor "Jeff Epler";\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
