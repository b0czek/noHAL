import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "tpcomp",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:tpcomp:tpcomp",
        name: "tpcomp",
        halComponentName: "tpcomp",
        source: "comp",
        sourcePath: "src/hal/components/tpcomp.comp",
        docs: {
          component: "Trajectory Planning (tp) module skeleton",
          description:
            "\nExample of a trajectory planning (tp) module buildable with\nhalcompile.\n\nThe tpcomp.comp file (src/hal/components/tpcomp.comp)\nillustrates a method to use halcompile to build a\ntrajectory planning module based on the files used for the\ndefault trajectory planner (\\\\fBtpmod\\\\fR).\n\nThe example tpcomp.comp is not usable until modified\nfor the user environment.  To create a runnable tpcomp\nmodule, the tpcomp.comp file must be edited to supply 1) a\nvalid '#define TOPDIR' and 2) references to valid source\ncode file names for all files used.\n\nTo avoid updates that overwrite tpcomp.comp, best practice is\nto rename the file and its component name (example:\n\\\\fBuser_tpcomp.comp\\\\fR creates module: \\\\fBuser_tpcomp\\\\fR).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default tp module\n(\\\\fBtpmod\\\\fR) using:\\n\n  $ linuxcnc \\\\fB-t user_tpcomp\\\\fR someconfig.ini\\n\nor by inifile setting: \\\\fB[TRAJ]TPMOD=user_tpcomp\\\\fR\n\n\\\\fBNote:\\\\fRIf using a deb install:\\n\n1) halcompile is provided by the deb package linuxcnc-dev\\n\n2) This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/tpcomp.comp\n",
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
            tpmod: true,
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component tpcomp"Trajectory Planning (tp) module skeleton";\n// NOTE: component name must agree with filename\n\ndescription """\nExample of a trajectory planning (tp) module buildable with\nhalcompile.\n\nThe tpcomp.comp file (src/hal/components/tpcomp.comp)\nillustrates a method to use halcompile to build a\ntrajectory planning module based on the files used for the\ndefault trajectory planner (\\\\fBtpmod\\\\fR).\n\nThe example tpcomp.comp is not usable until modified\nfor the user environment.  To create a runnable tpcomp\nmodule, the tpcomp.comp file must be edited to supply 1) a\nvalid \'#define TOPDIR\' and 2) references to valid source\ncode file names for all files used.\n\nTo avoid updates that overwrite tpcomp.comp, best practice is\nto rename the file and its component name (example:\n\\\\fBuser_tpcomp.comp\\\\fR creates module: \\\\fBuser_tpcomp\\\\fR).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default tp module\n(\\\\fBtpmod\\\\fR) using:\\n\n  $ linuxcnc \\\\fB-t user_tpcomp\\\\fR someconfig.ini\\n\nor by inifile setting: \\\\fB[TRAJ]TPMOD=user_tpcomp\\\\fR\n\n\\\\fBNote:\\\\fRIf using a deb install:\\n\n1) halcompile is provided by the deb package linuxcnc-dev\\n\n2) This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/tpcomp.comp\n""";\n\npin out bit is_module=1; //one pin is required to use halcompile)\n\nlicense "GPL";\nauthor "Dewey Garrett";\noption  tpmod;\noption  extra_setup;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:tpcomp:tpcomp",
        name: "tpcomp",
        halComponentName: "tpcomp",
        source: "comp",
        sourcePath: "src/hal/components/tpcomp.comp",
        docs: {
          component: "Trajectory Planning (tp) module skeleton",
          description:
            "\nExample of a trajectory planning (tp) module buildable with\nhalcompile.\n\nThe tpcomp.comp file (src/hal/components/tpcomp.comp)\nillustrates a method to use halcompile to build a\ntrajectory planning module based on the files used for the\ndefault trajectory planner (*tpmod*).\n\nThe example tpcomp.comp is not usable until modified\nfor the user environment.  To create a runnable tpcomp\nmodule, the tpcomp.comp file must be edited to supply 1) a\nvalid '#define TOPDIR' and 2) references to valid source\ncode file names for all files used.\n\nTo avoid updates that overwrite tpcomp.comp, best practice is\nto rename the file and its component name (example:\n*user_tpcomp.comp* creates module: *user_tpcomp*).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default tp module\n(*tpmod*) using:\n....\n  $ linuxcnc *-t user_tpcomp* someconfig.ini\n....\nor by inifile setting: *[TRAJ]TPMOD=user_tpcomp*\n\n*Note:*If using a deb install:\n\n1. halcompile is provided by the deb package linuxcnc-dev\n2. This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/tpcomp.comp\n\n",
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
            tpmod: true,
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component tpcomp"Trajectory Planning (tp) module skeleton";\n// NOTE: component name must agree with filename\n\ndescription """\nExample of a trajectory planning (tp) module buildable with\nhalcompile.\n\nThe tpcomp.comp file (src/hal/components/tpcomp.comp)\nillustrates a method to use halcompile to build a\ntrajectory planning module based on the files used for the\ndefault trajectory planner (*tpmod*).\n\nThe example tpcomp.comp is not usable until modified\nfor the user environment.  To create a runnable tpcomp\nmodule, the tpcomp.comp file must be edited to supply 1) a\nvalid \'#define TOPDIR\' and 2) references to valid source\ncode file names for all files used.\n\nTo avoid updates that overwrite tpcomp.comp, best practice is\nto rename the file and its component name (example:\n*user_tpcomp.comp* creates module: *user_tpcomp*).\n\nThe (renamed) component can be built and installed with\nhalcompile and then substituted for the default tp module\n(*tpmod*) using:\n....\n  $ linuxcnc *-t user_tpcomp* someconfig.ini\n....\nor by inifile setting: *[TRAJ]TPMOD=user_tpcomp*\n\n*Note:*If using a deb install:\n\n1. halcompile is provided by the deb package linuxcnc-dev\n2. This source file for BRANCHNAME (master,2.9,etc) is downloadable from github:\n\nhttps://github.com/LinuxCNC/linuxcnc/blob/BRANCHNAME/src/hal/components/tpcomp.comp\n\n""";\n\npin out bit is_module=1; //one pin is required to use halcompile)\n\nlicense "GPL";\nauthor "Dewey Garrett";\noption  tpmod;\noption  extra_setup;\n',
        },
      },
    },
  ],
};

export default history;
