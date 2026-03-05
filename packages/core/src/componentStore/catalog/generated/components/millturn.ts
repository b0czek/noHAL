import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "millturn",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:millturn:millturn",
        name: "millturn",
        halComponentName: "millturn",
        source: "comp",
        sourcePath: "src/hal/components/millturn.comp",
        docs: {
          component: "Switchable kinematics for a mill-turn machine",
          description:
            "\n.if \\\\n[.g] .mso www.tmac\n\nThis is a switchable kinematics module using 3 cartesian linear joints (XYZ)\nand 1 angular joint (A). The module contains two kinematic models:\n\ntype0 (default) is a mill (XYZA) configuration with A being a\nrotary axis.\n\ntype1 is a turn (Z-YX) configuration with A configured to be a spindle.\n\nFor an example configuration, run the sim config: 'configs/sim/axis/vismach/millturn/millturn.ini'.\n\nFurther explanations can be found in the README in 'configs/sim/axis/vismach/millturn'.\n\nmillturn.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: 'userkins.comp'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component millturn "Switchable kinematics for a mill-turn machine";\n\ndescription\n"""\n.if \\\\n[.g] .mso www.tmac\n\nThis is a switchable kinematics module using 3 cartesian linear joints (XYZ)\nand 1 angular joint (A). The module contains two kinematic models:\n\ntype0 (default) is a mill (XYZA) configuration with A being a\nrotary axis.\n\ntype1 is a turn (Z-YX) configuration with A configured to be a spindle.\n\nFor an example configuration, run the sim config: \'configs/sim/axis/vismach/millturn/millturn.ini\'.\n\nFurther explanations can be found in the README in \'configs/sim/axis/vismach/millturn\'.\n\nmillturn.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: \'userkins.comp\'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\nfunction fdemo;\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:millturn:millturn",
        name: "millturn",
        halComponentName: "millturn",
        source: "comp",
        sourcePath: "src/hal/components/millturn.comp",
        docs: {
          component: "Switchable kinematics for a mill-turn machine",
          description:
            "\nThis is a switchable kinematics module using 3 cartesian linear joints (XYZ)\nand 1 angular joint (A). The module contains two kinematic models:\n\ntype0 (default) is a mill (XYZA) configuration with A being a\nrotary axis.\n\ntype1 is a turn (Z-YX) configuration with A configured to be a spindle.\n\nFor an example configuration, run the sim config: 'configs/sim/axis/vismach/millturn/millturn.ini'.\n\nFurther explanations can be found in the README in 'configs/sim/axis/vismach/millturn'.\n\nmillturn.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: 'userkins.comp'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n",
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
            'component millturn "Switchable kinematics for a mill-turn machine";\n\ndescription\n"""\nThis is a switchable kinematics module using 3 cartesian linear joints (XYZ)\nand 1 angular joint (A). The module contains two kinematic models:\n\ntype0 (default) is a mill (XYZA) configuration with A being a\nrotary axis.\n\ntype1 is a turn (Z-YX) configuration with A configured to be a spindle.\n\nFor an example configuration, run the sim config: \'configs/sim/axis/vismach/millturn/millturn.ini\'.\n\nFurther explanations can be found in the README in \'configs/sim/axis/vismach/millturn\'.\n\nmillturn.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: \'userkins.comp\'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\noption period no;\nfunction fdemo;\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
  ],
};

export default history;
