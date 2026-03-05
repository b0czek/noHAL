import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "comp",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:comp:comp",
        name: "comp",
        halComponentName: "comp",
        source: "comp",
        sourcePath: "src/hal/components/comp.comp",
        docs: {
          component: "Two input comparator with hysteresis",
          license: "GPL",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            doc: "Inverting input to the comparator",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "Non-inverting input to the comparator",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Normal output. True when \\fBin1\\fR > \\fBin0\\fR (see parameter \\fBhyst\\fR for details)",
            direction: "out",
          },
          {
            key: "equal",
            name: "equal",
            type: "bit",
            doc: "Match output.  True when difference between \\fBin1\\fR and \\fBin0\\fR is less than \\fBhyst\\fR/2",
            direction: "out",
          },
        ],
        params: [
          {
            key: "hyst",
            name: "hyst",
            type: "float",
            doc: "Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance \\\\fBhyst\\\\fR around the point where \\\\fBin1\\\\fR = \\\\fBin0\\\\fR.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set \\\\fBhyst\\\\fR if you intend to use equal ",
            defaultValue: "0.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the comparator",
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
            'component comp "Two input comparator with hysteresis";\npin in float in0 "Inverting input to the comparator";\npin in float in1 "Non-inverting input to the comparator";\npin out bit out "Normal output. True when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR (see parameter \\\\fBhyst\\\\fR for details)";\npin out bit equal "Match output.  True when difference between \\\\fBin1\\\\fR and \\\\fBin0\\\\fR is less than \\\\fBhyst\\\\fR/2";\n\nparam rw float hyst=0.0 """Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance \\\\fBhyst\\\\fR around the point where \\\\fBin1\\\\fR = \\\\fBin0\\\\fR.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set \\\\fBhyst\\\\fR if you intend to use equal """;\n\nfunction _ fp "Update the comparator";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:comp:comp",
        name: "comp",
        halComponentName: "comp",
        source: "comp",
        sourcePath: "src/hal/components/comp.comp",
        docs: {
          component: "Two input comparator with hysteresis",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            doc: "Inverting input to the comparator",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "Non-inverting input to the comparator",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Normal output. True when \\fBin1\\fR > \\fBin0\\fR (see parameter \\fBhyst\\fR for details)",
            direction: "out",
          },
          {
            key: "equal",
            name: "equal",
            type: "bit",
            doc: "Match output.  True when difference between \\fBin1\\fR and \\fBin0\\fR is less than \\fBhyst\\fR/2",
            direction: "out",
          },
        ],
        params: [
          {
            key: "hyst",
            name: "hyst",
            type: "float",
            doc: "Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance \\\\fBhyst\\\\fR around the point where \\\\fBin1\\\\fR = \\\\fBin0\\\\fR.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set \\\\fBhyst\\\\fR if you intend to use equal ",
            defaultValue: "0.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the comparator",
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
            'component comp "Two input comparator with hysteresis";\npin in float in0 "Inverting input to the comparator";\npin in float in1 "Non-inverting input to the comparator";\npin out bit out "Normal output. True when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR (see parameter \\\\fBhyst\\\\fR for details)";\npin out bit equal "Match output.  True when difference between \\\\fBin1\\\\fR and \\\\fBin0\\\\fR is less than \\\\fBhyst\\\\fR/2";\n\nparam rw float hyst=0.0 """Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when \\\\fBin1\\\\fR > \\\\fBin0\\\\fR.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance \\\\fBhyst\\\\fR around the point where \\\\fBin1\\\\fR = \\\\fBin0\\\\fR.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set \\\\fBhyst\\\\fR if you intend to use equal """;\n\nfunction _ fp "Update the comparator";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:comp:comp",
        name: "comp",
        halComponentName: "comp",
        source: "comp",
        sourcePath: "src/hal/components/comp.comp",
        docs: {
          component: "Two input comparator with hysteresis",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            doc: "Inverting input to the comparator",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "Non-inverting input to the comparator",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Normal output. True when *in1* > *in0* (see parameter *hyst* for details)",
            direction: "out",
          },
          {
            key: "equal",
            name: "equal",
            type: "bit",
            doc: "Match output.  True when difference between *in1* and *in0* is less than *hyst*/2",
            direction: "out",
          },
        ],
        params: [
          {
            key: "hyst",
            name: "hyst",
            type: "float",
            doc: "Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when *in1* > *in0*.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance *hyst* around the point where *in1* = *in0*.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set *hyst* if you intend to use equal ",
            defaultValue: "0.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the comparator",
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
            'component comp "Two input comparator with hysteresis";\npin in float in0 "Inverting input to the comparator";\npin in float in1 "Non-inverting input to the comparator";\npin out bit out "Normal output. True when *in1* > *in0* (see parameter *hyst* for details)";\npin out bit equal "Match output.  True when difference between *in1* and *in0* is less than *hyst*/2";\n\nparam rw float hyst=0.0 """Hysteresis of the comparator (default 0.0)\n\nWith zero hysteresis, the output is true when *in1* > *in0*.  With nonzero\nhysteresis, the output switches on and off at two different values,\nseparated by distance *hyst* around the point where *in1* = *in0*.\nKeep in mind that floating point calculations are never absolute\nand it is wise to always set *hyst* if you intend to use equal """;\n\noption period no;\nfunction _ fp "Update the comparator";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
