import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "deadzone",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:deadzone:deadzone",
        name: "deadzone",
        halComponentName: "deadzone",
        source: "comp",
        sourcePath: "src/hal/components/deadzone.comp",
        docs: {
          component: "Return the center if within the threshold",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "center",
            name: "center",
            type: "float",
            doc: "The center of the dead zone",
            defaultValue: "0.0",
            direction: "rw",
          },
          {
            key: "threshhold",
            name: "threshhold",
            type: "float",
            doc: "The dead zone is \\fBcenter\\fR \\(+- (\\fBthreshhold\\fR/2)",
            defaultValue: "1.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update \\fBout\\fR based on \\fBin\\fR and the parameters.",
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
            'component deadzone "Return the center if within the threshold";\nparam rw float center = 0.0 "The center of the dead zone";\nparam rw float threshhold = 1.0 "The dead zone is \\\\fBcenter\\\\fR \\\\(+- (\\\\fBthreshhold\\\\fR/2)";\npin in float in;\npin out float out;\n\nfunction _ "Update \\\\fBout\\\\fR based on \\\\fBin\\\\fR and the parameters.";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:deadzone:deadzone",
        name: "deadzone",
        halComponentName: "deadzone",
        source: "comp",
        sourcePath: "src/hal/components/deadzone.comp",
        docs: {
          component: "Return the center if within the threshold",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "center",
            name: "center",
            type: "float",
            doc: "The center of the dead zone",
            defaultValue: "0.0",
            direction: "rw",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "float",
            doc: "The dead zone is \\fBcenter\\fR \\(+- (\\fBthreshold\\fR/2)",
            defaultValue: "1.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update \\fBout\\fR based on \\fBin\\fR and the parameters.",
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
            'component deadzone "Return the center if within the threshold";\nparam rw float center = 0.0 "The center of the dead zone";\nparam rw float threshold = 1.0 "The dead zone is \\\\fBcenter\\\\fR \\\\(+- (\\\\fBthreshold\\\\fR/2)";\npin in float in;\npin out float out;\n\nfunction _ "Update \\\\fBout\\\\fR based on \\\\fBin\\\\fR and the parameters.";\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:deadzone:deadzone",
        name: "deadzone",
        halComponentName: "deadzone",
        source: "comp",
        sourcePath: "src/hal/components/deadzone.comp",
        docs: {
          component: "Return the center if within the threshold",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "center",
            name: "center",
            type: "float",
            doc: "The center of the dead zone",
            defaultValue: "0.0",
            direction: "rw",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "float",
            doc: "The dead zone is *center* ±(*threshold*/2)",
            defaultValue: "1.0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update *out* based on *in* and the parameters.",
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
            'component deadzone "Return the center if within the threshold";\nparam rw float center = 0.0 "The center of the dead zone";\nparam rw float threshold = 1.0 "The dead zone is *center* ±(*threshold*/2)";\npin in float in;\npin out float out;\n\noption period no;\nfunction _ "Update *out* based on *in* and the parameters.";\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
