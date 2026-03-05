import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "xyzacb_trsrn",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:xyzacb-trsrn:xyzacb-trsrn",
        name: "xyzacb_trsrn",
        halComponentName: "xyzacb_trsrn",
        source: "comp",
        sourcePath: "src/hal/components/xyzacb_trsrn.comp",
        docs: {
          component:
            "Switchable kinematics for 6 axis machine with a rotary table C, rotary spindle B and nutating spindle A",
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
            'component xyzacb_trsrn "Switchable kinematics for 6 axis machine with a rotary table C, rotary spindle B and nutating spindle A";\n\ndescription\n"""\nFIXME\n\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\noption period no;\nfunction fdemo;\n\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
  ],
};

export default history;
