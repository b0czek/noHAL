import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "homecomp",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:homecomp:homecomp",
        name: "homecomp",
        halComponentName: "homecomp",
        source: "comp",
        sourcePath: "src/hal/components/homecomp.comp",
        docs: {
          component: "homing module template",
          description:
            '\nExample of a homing module buildable with halcompile.\nDemonstrates required code for #includes, function definitions, etc.\n\nIf \\\\fBHOMING_BASE\\\\fR is #defined and points to a valid homing.c file,\nan example of a customized homing module is built.  This module\ncreates input hal pins joint.n.request-custom-homing that enable an\nalternate joint homing state machine for requested joints.  A hal output\npin joint.N.is_custom-homing verifies selection"\n\nThe customized homing module utilizes many of the base homing api\nroutines from homing.c without modification but augments other base\nfunctions to add support for custom hal pins and custom joint homing\nstate machines.  A user-built module will likely replace additional\napi functions or augment them with other customizations.\n\nIf \\\\fBHOMING_BASE\\\\fR Is not #defined, an  actual homing scheme is\n\\\\fBnot\\\\fR implemented but all necessary functions are included as\nskeleton code.   (All joints are effectively homed at all times and\ncannot be unhomed).\n\nSee the source code file: src/emc/motion/homing.c for the baseline\nimplementation that includes all functions for the default \\\\fBhomemod\\\\fR\nmodule.\n\nTo avoid updates that overwrite homecomp.comp, best practice is\nto rename the file and its component name (example:\n\\\\fBuser_homecomp.comp, user_homecomp\\\\fR).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default homing module\n(\\\\fBhomemod\\\\fR) using:\\n\n  $ linuxcnc \\\\fB-m user_homecomp\\\\fR someconfig.ini\\n\nor by inifile setting: \\\\fB[EMCMOT]HOMEMOD=user_homecomp\\\\fR\n\n\\\\fBNote:\\\\fRIf using a deb install:\\n\n1) halcompile is provided by the package linuxcnc-dev\\n\n2) This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/homecomp.comp\n',
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "is_module",
            name: "is-module",
            type: "bit",
            defaultValue: "1",
            direction: "out",
          },
        ],
        params: [],
        functions: [],
        runtime: {
          kind: "rt",
          options: {
            homemod: true,
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component homecomp"homing module template";\n\ndescription """\nExample of a homing module buildable with halcompile.\nDemonstrates required code for #includes, function definitions, etc.\n\nIf \\\\fBHOMING_BASE\\\\fR is #defined and points to a valid homing.c file,\nan example of a customized homing module is built.  This module\ncreates input hal pins joint.n.request-custom-homing that enable an\nalternate joint homing state machine for requested joints.  A hal output\npin joint.N.is_custom-homing verifies selection"\n\nThe customized homing module utilizes many of the base homing api\nroutines from homing.c without modification but augments other base\nfunctions to add support for custom hal pins and custom joint homing\nstate machines.  A user-built module will likely replace additional\napi functions or augment them with other customizations.\n\nIf \\\\fBHOMING_BASE\\\\fR Is not #defined, an  actual homing scheme is\n\\\\fBnot\\\\fR implemented but all necessary functions are included as\nskeleton code.   (All joints are effectively homed at all times and\ncannot be unhomed).\n\nSee the source code file: src/emc/motion/homing.c for the baseline\nimplementation that includes all functions for the default \\\\fBhomemod\\\\fR\nmodule.\n\nTo avoid updates that overwrite homecomp.comp, best practice is\nto rename the file and its component name (example:\n\\\\fBuser_homecomp.comp, user_homecomp\\\\fR).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default homing module\n(\\\\fBhomemod\\\\fR) using:\\n\n  $ linuxcnc \\\\fB-m user_homecomp\\\\fR someconfig.ini\\n\nor by inifile setting: \\\\fB[EMCMOT]HOMEMOD=user_homecomp\\\\fR\n\n\\\\fBNote:\\\\fRIf using a deb install:\\n\n1) halcompile is provided by the package linuxcnc-dev\\n\n2) This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/homecomp.comp\n""";\n\npin out bit is_module=1; //one pin is required to use halcompile)\n\nlicense "GPL";\nauthor "Dewey Garrett";\noption  homemod;\noption  extra_setup;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:homecomp:homecomp",
        name: "homecomp",
        halComponentName: "homecomp",
        source: "comp",
        sourcePath: "src/hal/components/homecomp.comp",
        docs: {
          component: "homing module template",
          description:
            '\nExample of a homing module buildable with halcompile.\nDemonstrates required code for #includes, function definitions, etc.\n\nIf *HOMING_BASE* is #defined and points to a valid `homing.c` file,\nan example of a customized homing module is built.  This module\ncreates input hal pins joint.n.request-custom-homing that enable an\nalternate joint homing state machine for requested joints.  A hal output\npin joint.N.is_custom-homing verifies selection"\n\nThe customized homing module utilizes many of the base homing api\nroutines from homing.c without modification but augments other base\nfunctions to add support for custom hal pins and custom joint homing\nstate machines.  A user-built module will likely replace additional\napi functions or augment them with other customizations.\n\nIf *HOMING_BASE* is not #defined, an  actual homing scheme is\n*not* implemented but all necessary functions are included as\nskeleton code.   (All joints are effectively homed at all times and\ncannot be unhomed).\n\nSee the source code file: `src/emc/motion/homing.c` for the baseline\nimplementation that includes all functions for the default *homemod*\nmodule.\n\nTo avoid updates that overwrite homecomp.comp, best practice is\nto rename the file and its component name (example:\n*user_homecomp.comp*, *user_homecomp*).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default homing module\n(*homemod*) using:\n\n  $ linuxcnc -m user_homecomp someconfig.ini\n\nor by inifile setting:\n\n\n[source,ini]\n----\n[EMCMOT]\nHOMEMOD=user_homecomp\n----\n\n*Note*: If using a deb install:\n\n1. halcompile is provided by the package linuxcnc-dev\\n\n2. This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/homecomp.comp\n',
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "is_module",
            name: "is-module",
            type: "bit",
            defaultValue: "1",
            direction: "out",
          },
        ],
        params: [],
        functions: [],
        runtime: {
          kind: "rt",
          options: {
            homemod: true,
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component homecomp"homing module template";\n\ndescription """\nExample of a homing module buildable with halcompile.\nDemonstrates required code for #includes, function definitions, etc.\n\nIf *HOMING_BASE* is #defined and points to a valid `homing.c` file,\nan example of a customized homing module is built.  This module\ncreates input hal pins joint.n.request-custom-homing that enable an\nalternate joint homing state machine for requested joints.  A hal output\npin joint.N.is_custom-homing verifies selection"\n\nThe customized homing module utilizes many of the base homing api\nroutines from homing.c without modification but augments other base\nfunctions to add support for custom hal pins and custom joint homing\nstate machines.  A user-built module will likely replace additional\napi functions or augment them with other customizations.\n\nIf *HOMING_BASE* is not #defined, an  actual homing scheme is\n*not* implemented but all necessary functions are included as\nskeleton code.   (All joints are effectively homed at all times and\ncannot be unhomed).\n\nSee the source code file: `src/emc/motion/homing.c` for the baseline\nimplementation that includes all functions for the default *homemod*\nmodule.\n\nTo avoid updates that overwrite homecomp.comp, best practice is\nto rename the file and its component name (example:\n*user_homecomp.comp*, *user_homecomp*).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default homing module\n(*homemod*) using:\n\n  $ linuxcnc -m user_homecomp someconfig.ini\n\nor by inifile setting:\n\n\n[source,ini]\n----\n[EMCMOT]\nHOMEMOD=user_homecomp\n----\n\n*Note*: If using a deb install:\n\n1. halcompile is provided by the package linuxcnc-dev\\n\n2. This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/homecomp.comp\n""";\n\npin out bit is_module=1; //one pin is required to use halcompile)\n\nlicense "GPL";\nauthor "Dewey Garrett";\noption  homemod;\noption  extra_setup;\n',
        },
      },
    },
  ],
};

export default history;
