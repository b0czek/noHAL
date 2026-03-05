import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "xyzab_tdr_kins",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:xyzab-tdr-kins:xyzab-tdr-kins",
        name: "xyzab_tdr_kins",
        halComponentName: "xyzab_tdr_kins",
        source: "comp",
        sourcePath: "src/hal/components/xyzab_tdr_kins.comp",
        docs: {
          component:
            "Switchable kinematics for 5 axis machine with rotary table A and B",
          description:
            "\n\nThis is a switchable kinematics module for a 5-axis milling configuration\nusing 3 cartesian linear joints (XYZ) and 2 rotary table joints (AB).\n\nThe module contains two kinematic models:\n\ntype0 (default) is a trivial XYZAB configuration with joints 0..4 mapped to\naxes XYZAB respectively.\n\ntype1 is a XYZAB configuration with tool center point (TCP) compensation.\n\nFor an example configuration, run the sim config: '/configs/sim/axis/vismach/5axis/table-dual-rotary/xyzab-tdr.ini'.\n\nFurther explanations can be found in the README in '/configs/sim/axis/vismach/5axis/table-dual-rotary/'.\n\nxyzab_tdr_kins.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: 'userkins.comp'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n.if \\\\n[.g] .mso www.tmac\n",
          license: "GPL",
          author: "David Mueller",
        },
        pins: [
          {
            key: "dummy",
            name: "dummy",
            type: "s32",
            doc: "one pin needed to satisfy halcompile requirement",
            defaultValue: "0",
            direction: "out",
          },
        ],
        params: [],
        functions: [],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component  xyzab_tdr_kins "Switchable kinematics for 5 axis machine with rotary table A and B";\n\ndescription\n"""\n\nThis is a switchable kinematics module for a 5-axis milling configuration\nusing 3 cartesian linear joints (XYZ) and 2 rotary table joints (AB).\n\nThe module contains two kinematic models:\n\ntype0 (default) is a trivial XYZAB configuration with joints 0..4 mapped to\naxes XYZAB respectively.\n\ntype1 is a XYZAB configuration with tool center point (TCP) compensation.\n\nFor an example configuration, run the sim config: \'/configs/sim/axis/vismach/5axis/table-dual-rotary/xyzab-tdr.ini\'.\n\nFurther explanations can be found in the README in \'/configs/sim/axis/vismach/5axis/table-dual-rotary/\'.\n\nxyzab_tdr_kins.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: \'userkins.comp\'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n.if \\\\n[.g] .mso www.tmac\n""";\n\npin out s32 dummy=0"one pin needed to satisfy halcompile requirement";\n\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:xyzab-tdr-kins:xyzab-tdr-kins",
        name: "xyzab_tdr_kins",
        halComponentName: "xyzab_tdr_kins",
        source: "comp",
        sourcePath: "src/hal/components/xyzab_tdr_kins.comp",
        docs: {
          component:
            "Switchable kinematics for 5 axis machine with rotary table A and B",
          description:
            "\n\nThis is a switchable kinematics module for a 5-axis milling configuration\nusing 3 cartesian linear joints (XYZ) and 2 rotary table joints (AB).\n\nThe module contains two kinematic models:\n\ntype0 (default) is a trivial XYZAB configuration with joints 0..4 mapped to\naxes XYZAB respectively.\n\ntype1 is a XYZAB configuration with tool center point (TCP) compensation.\n\nFor an example configuration, run the sim config: '/configs/sim/axis/vismach/5axis/table-dual-rotary/xyzab-tdr.ini'.\n\nFurther explanations can be found in the README in '/configs/sim/axis/vismach/5axis/table-dual-rotary/'.\n\nxyzab_tdr_kins.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: 'userkins.comp'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n",
          license: "GPL",
          author: "David Mueller",
        },
        pins: [
          {
            key: "dummy",
            name: "dummy",
            type: "s32",
            doc: "one pin needed to satisfy halcompile requirement",
            defaultValue: "0",
            direction: "out",
          },
        ],
        params: [],
        functions: [],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component  xyzab_tdr_kins "Switchable kinematics for 5 axis machine with rotary table A and B";\n\ndescription\n"""\n\nThis is a switchable kinematics module for a 5-axis milling configuration\nusing 3 cartesian linear joints (XYZ) and 2 rotary table joints (AB).\n\nThe module contains two kinematic models:\n\ntype0 (default) is a trivial XYZAB configuration with joints 0..4 mapped to\naxes XYZAB respectively.\n\ntype1 is a XYZAB configuration with tool center point (TCP) compensation.\n\nFor an example configuration, run the sim config: \'/configs/sim/axis/vismach/5axis/table-dual-rotary/xyzab-tdr.ini\'.\n\nFurther explanations can be found in the README in \'/configs/sim/axis/vismach/5axis/table-dual-rotary/\'.\n\nxyzab_tdr_kins.comp was constructed by modifying the template file:\nuserkins.comp.\n\nFor more information on how to modify userkins.comp run: $ man\nuserkins.   Also, see additional information inside: \'userkins.comp\'.\n\nFor information on kinematics in general see the kinematics\ndocument chapter (docs/src/motion/kinematics.txt) and for\nswitchable kinematics in particular see the switchkins document\nchapter (docs/src/motion/switchkins.txt)\n\n""";\n\npin out s32 dummy=0"one pin needed to satisfy halcompile requirement";\n\nlicense "GPL";\nauthor "David Mueller";\n',
        },
      },
    },
  ],
};

export default history;
