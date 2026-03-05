import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "xyzbca_trsrn",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:xyzbca-trsrn:xyzbca-trsrn",
        name: "xyzbca_trsrn",
        halComponentName: "xyzbca_trsrn",
        source: "comp",
        sourcePath: "src/hal/components/xyzbca_trsrn.comp",
        docs: {
          component:
            "Switchable kinematics for 6 axis machine with a rotary table B, rotary spindle C and nutating spindle A",
          description: "\nFIXME\n\n",
          license: "GPL",
          author: "David Mueller",
        },
        pins: [
          {
            key: "fpin",
            name: "fpin",
            type: "s32",
            doc: "pin to demonstrate use of a conventional (non-kinematics) function fdemo",
            defaultValue: "0",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "fdemo",
            declaredName: "fdemo",
            halSuffix: "fdemo",
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
            'component xyzbca_trsrn "Switchable kinematics for 6 axis machine with a rotary table B, rotary spindle C and nutating spindle A";\n\ndescription\n"""\nFIXME\n\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\noption period no;\nfunction fdemo;\n\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
  ],
};

export default history;
