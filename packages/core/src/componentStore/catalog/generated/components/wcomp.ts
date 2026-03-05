import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "wcomp",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:wcomp:wcomp",
        name: "wcomp",
        halComponentName: "wcomp",
        source: "comp",
        sourcePath: "src/hal/components/wcomp.comp",
        docs: {
          component: "Window comparator",
          notes:
            "If \\fBmax\\fR <= \\fBmin\\fR then the behavior is undefined.",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Value being compared",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            doc: "Low boundary for comparison",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            doc: "High boundary for comparison",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "True if \\fBin\\fR is strictly between \\fBmin\\fR and \\fBmax\\fR",
            direction: "out",
          },
          {
            key: "under",
            name: "under",
            type: "bit",
            doc: "True if \\fBin\\fR is less than or equal to \\fBmin\\fR",
            direction: "out",
          },
          {
            key: "over",
            name: "over",
            type: "bit",
            doc: "True if \\fBin\\fR is greater than or equal to \\fBmax\\fR",
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
            'component wcomp "Window comparator";\npin in float in "Value being compared";\npin in float min_ "Low boundary for comparison";\npin in float max_ "High boundary for comparison";\npin out bit out "True if \\\\fBin\\\\fR is strictly between \\\\fBmin\\\\fR and \\\\fBmax\\\\fR";\npin out bit under "True if \\\\fBin\\\\fR is less than or equal to \\\\fBmin\\\\fR";\npin out bit over "True if \\\\fBin\\\\fR is greater than or equal to \\\\fBmax\\\\fR";\nnotes "If \\\\fBmax\\\\fR <= \\\\fBmin\\\\fR then the behavior is undefined.";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:wcomp:wcomp",
        name: "wcomp",
        halComponentName: "wcomp",
        source: "comp",
        sourcePath: "src/hal/components/wcomp.comp",
        docs: {
          component: "Window comparator",
          notes:
            "If \\fBmax\\fR <= \\fBmin\\fR then the behavior is undefined.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Value being compared",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            doc: "Low boundary for comparison",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            doc: "High boundary for comparison",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "True if \\fBin\\fR is strictly between \\fBmin\\fR and \\fBmax\\fR",
            direction: "out",
          },
          {
            key: "under",
            name: "under",
            type: "bit",
            doc: "True if \\fBin\\fR is less than or equal to \\fBmin\\fR",
            direction: "out",
          },
          {
            key: "over",
            name: "over",
            type: "bit",
            doc: "True if \\fBin\\fR is greater than or equal to \\fBmax\\fR",
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
            'component wcomp "Window comparator";\npin in float in "Value being compared";\npin in float min_ "Low boundary for comparison";\npin in float max_ "High boundary for comparison";\npin out bit out "True if \\\\fBin\\\\fR is strictly between \\\\fBmin\\\\fR and \\\\fBmax\\\\fR";\npin out bit under "True if \\\\fBin\\\\fR is less than or equal to \\\\fBmin\\\\fR";\npin out bit over "True if \\\\fBin\\\\fR is greater than or equal to \\\\fBmax\\\\fR";\nnotes "If \\\\fBmax\\\\fR <= \\\\fBmin\\\\fR then the behavior is undefined.";\n\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:wcomp:wcomp",
        name: "wcomp",
        halComponentName: "wcomp",
        source: "comp",
        sourcePath: "src/hal/components/wcomp.comp",
        docs: {
          component: "Window comparator",
          notes: "If *max* <= *min* then the behavior is undefined.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Value being compared",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            doc: "Low boundary for comparison",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            doc: "High boundary for comparison",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "True if *in* is strictly between *min* and *max*",
            direction: "out",
          },
          {
            key: "under",
            name: "under",
            type: "bit",
            doc: "True if *in* is less than or equal to *min*",
            direction: "out",
          },
          {
            key: "over",
            name: "over",
            type: "bit",
            doc: "True if *in* is greater than or equal to *max*",
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
            'component wcomp "Window comparator";\npin in float in "Value being compared";\npin in float min_ "Low boundary for comparison";\npin in float max_ "High boundary for comparison";\npin out bit out "True if *in* is strictly between *min* and *max*";\npin out bit under "True if *in* is less than or equal to *min*";\npin out bit over "True if *in* is greater than or equal to *max*";\nnotes "If *max* <= *min* then the behavior is undefined.";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
