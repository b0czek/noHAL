import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "userkins",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:userkins:userkins",
        name: "userkins",
        halComponentName: "userkins",
        source: "comp",
        sourcePath: "src/hal/components/userkins.comp",
        docs: {
          component: "Template for user-built kinematics",
          description:
            "\n.if \\\\n[.g] .mso www.tmac\n\nThe userkins.comp file is a template for creating\nkinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used\nas a kinematics file for a machine with identity\nkinematics for an xyz machine employing 3 joints\n(motors).\n\n\\\\fBUSAGE:\\\\fR\n\n  1) Copy the userkins.comp file to a user-owned\n     directory (\\\\fBmydir\\\\fR).\n\n     Note: The userkins.comp file can be downloaded from:\n.URL https://github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp \n     where '2.8' is the branch name (use 'master' for\n     the master branch)\n\n     For a RIP (run-in-place) build, the file is located in\n     the git tree as:\n       src/hal/components/userkins.comp\n\n  2) Edit the functions kinematicsForward() and\n     kinematicsInverse() as required\n  3) If required, add hal pins following examples in\n     the template code\n  4) Build and install the component using halcompile:\n     $ cd \\\\fBmydir\\\\fR\n     $ [sudo] halcompile --install userkins.comp\n     # Note:\n     #      sudo is required when using a deb install\n     #      sudo is \\\\fBnot\\\\fR required for run-in-place builds\n     # $ man halcompile for more info\n  5) Specify userkins in an ini file as:\n     \\\\fB[KINS]\\\\fR\n     \\\\fBKINEMATICS=userkins\\\\fR\n     \\\\fBJOINTS=3\\\\fR\n     # the number of JOINTS must agree with the\n     # number of joints used in your modified userkins.comp\n  6) Note: the manpage for userkins is not updated by\n     halcompile --install\n  7) To use a different component name, rename the file\n     (example mykins.comp) and change all instances of\n     'userkins' to 'mykins'\n\n",
          license: "GPL",
        },
        pins: [
          {
            key: "dummy",
            name: "dummy",
            type: "bit",
            defaultValue: "1",
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
            'component userkins"Template for user-built kinematics";\n\ndescription\n"""\n.if \\\\n[.g] .mso www.tmac\n\nThe userkins.comp file is a template for creating\nkinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used\nas a kinematics file for a machine with identity\nkinematics for an xyz machine employing 3 joints\n(motors).\n\n\\\\fBUSAGE:\\\\fR\n\n  1) Copy the userkins.comp file to a user-owned\n     directory (\\\\fBmydir\\\\fR).\n\n     Note: The userkins.comp file can be downloaded from:\n.URL https://github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp \n     where \'2.8\' is the branch name (use \'master\' for\n     the master branch)\n\n     For a RIP (run-in-place) build, the file is located in\n     the git tree as:\n       src/hal/components/userkins.comp\n\n  2) Edit the functions kinematicsForward() and\n     kinematicsInverse() as required\n  3) If required, add hal pins following examples in\n     the template code\n  4) Build and install the component using halcompile:\n     $ cd \\\\fBmydir\\\\fR\n     $ [sudo] halcompile --install userkins.comp\n     # Note:\n     #      sudo is required when using a deb install\n     #      sudo is \\\\fBnot\\\\fR required for run-in-place builds\n     # $ man halcompile for more info\n  5) Specify userkins in an ini file as:\n     \\\\fB[KINS]\\\\fR\n     \\\\fBKINEMATICS=userkins\\\\fR\n     \\\\fBJOINTS=3\\\\fR\n     # the number of JOINTS must agree with the\n     # number of joints used in your modified userkins.comp\n  6) Note: the manpage for userkins is not updated by\n     halcompile --install\n  7) To use a different component name, rename the file\n     (example mykins.comp) and change all instances of\n     \'userkins\' to \'mykins\'\n\n""";\npin out bit dummy=1; // halcompile requires at least one pin\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:userkins:userkins",
        name: "userkins",
        halComponentName: "userkins",
        source: "comp",
        sourcePath: "src/hal/components/userkins.comp",
        docs: {
          component: "Template for user-built kinematics",
          description:
            "\n.if \\\\n[.g] .mso www.tmac\n\nThe userkins.comp file is a template for creating\nkinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used\nas a kinematics file for a machine with identity\nkinematics for an xyz machine employing 3 joints\n(motors).\n\n\\\\fBUSAGE:\\\\fR\n\n  1) Copy the userkins.comp file to a user-owned\n     directory (\\\\fBmydir\\\\fR).\n\n     Note: The userkins.comp file can be downloaded from:\n.URL https://github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp\n     where '2.8' is the branch name (use 'master' for\n     the master branch)\n\n     For a RIP (run-in-place) build, the file is located in\n     the git tree as:\n       src/hal/components/userkins.comp\n\n  2) Edit the functions kinematicsForward() and\n     kinematicsInverse() as required\n  3) If required, add hal pins following examples in\n     the template code\n  4) Build and install the component using halcompile:\n     $ cd \\\\fBmydir\\\\fR\n     $ [sudo] halcompile --install userkins.comp\n     # Note:\n     #      sudo is required when using a deb install\n     #      sudo is \\\\fBnot\\\\fR required for run-in-place builds\n     # $ man halcompile for more info\n  5) Specify userkins in an ini file as:\n     \\\\fB[KINS]\\\\fR\n     \\\\fBKINEMATICS=userkins\\\\fR\n     \\\\fBJOINTS=3\\\\fR\n     # the number of JOINTS must agree with the\n     # number of joints used in your modified userkins.comp\n  6) Note: the manpage for userkins is not updated by\n     halcompile --install\n  7) To use a different component name, rename the file\n     (example mykins.comp) and change all instances of\n     'userkins' to 'mykins'\n\n\\\\fBNOTES:\\\\fR\n  1  The \\\\fBfpin\\\\fR pin is included to satisfy the requirements of\n     the halcompile utility but it is not accessible to kinematics\n     functions.\n\n  2  Hal pins and parameters needed in kinematics functions\n     (kinematicsForward(), kinematicsInverse()) must\n     be setup in a function (\\\\fBuserkins_setup()\\\\fR) invoked\n     by the initial motion module call to kinematicsType().\n",
          license: "GPL",
          author: "Dewey Garrett",
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
            'component userkins"Template for user-built kinematics";\n\ndescription\n"""\n.if \\\\n[.g] .mso www.tmac\n\nThe userkins.comp file is a template for creating\nkinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used\nas a kinematics file for a machine with identity\nkinematics for an xyz machine employing 3 joints\n(motors).\n\n\\\\fBUSAGE:\\\\fR\n\n  1) Copy the userkins.comp file to a user-owned\n     directory (\\\\fBmydir\\\\fR).\n\n     Note: The userkins.comp file can be downloaded from:\n.URL https://github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp\n     where \'2.8\' is the branch name (use \'master\' for\n     the master branch)\n\n     For a RIP (run-in-place) build, the file is located in\n     the git tree as:\n       src/hal/components/userkins.comp\n\n  2) Edit the functions kinematicsForward() and\n     kinematicsInverse() as required\n  3) If required, add hal pins following examples in\n     the template code\n  4) Build and install the component using halcompile:\n     $ cd \\\\fBmydir\\\\fR\n     $ [sudo] halcompile --install userkins.comp\n     # Note:\n     #      sudo is required when using a deb install\n     #      sudo is \\\\fBnot\\\\fR required for run-in-place builds\n     # $ man halcompile for more info\n  5) Specify userkins in an ini file as:\n     \\\\fB[KINS]\\\\fR\n     \\\\fBKINEMATICS=userkins\\\\fR\n     \\\\fBJOINTS=3\\\\fR\n     # the number of JOINTS must agree with the\n     # number of joints used in your modified userkins.comp\n  6) Note: the manpage for userkins is not updated by\n     halcompile --install\n  7) To use a different component name, rename the file\n     (example mykins.comp) and change all instances of\n     \'userkins\' to \'mykins\'\n\n\\\\fBNOTES:\\\\fR\n  1  The \\\\fBfpin\\\\fR pin is included to satisfy the requirements of\n     the halcompile utility but it is not accessible to kinematics\n     functions.\n\n  2  Hal pins and parameters needed in kinematics functions\n     (kinematicsForward(), kinematicsInverse()) must\n     be setup in a function (\\\\fBuserkins_setup()\\\\fR) invoked\n     by the initial motion module call to kinematicsType().\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\nfunction fdemo;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:userkins:userkins",
        name: "userkins",
        halComponentName: "userkins",
        source: "comp",
        sourcePath: "src/hal/components/userkins.comp",
        docs: {
          component: "Template for user-built kinematics",
          description:
            "\nThe userkins.comp file is a template for creating kinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used as a kinematics file\nfor a machine with identity kinematics for an xyz machine employing 3 joints (motors).\n\n=== USAGE\n\nCopy the userkins.comp file to a user-owned directory (*mydir*). +\nNote: The userkins.comp file can be downloaded from:\n  `github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp`\nwhere '2.8' is the branch name (use 'master' for the master branch).\nFor a RIP (run-in-place) build, the file is located in the git tree as:\n  `src/hal/components/userkins.comp`.\n\nEdit the functions kinematicsForward() and kinematicsInverse() as required.\n\nIf required, add HAL pins following examples in the template code.\n\nBuild and install the component using halcompile:\n\n[source,sh]\n----\n$ cd mydir\n$ [sudo] halcompile --install userkins.comp\n# Note:\n#      sudo is required when using a deb install\n#      sudo is *not* required for run-in-place builds\n# $ man halcompile for more info\n----\n\nSpecify userkins in an ini file as:\n\n[source,ini]\n----\n[KINS]\nKINEMATICS=userkins\nJOINTS=3\n# the number of JOINTS must agree with the\n# number of joints used in your modified userkins.comp\n----\n\nNote: the manpage for userkins is not updated by `halcompile --install`\n\nTo use a different component name, rename the file (example mykins.comp) and\nchange all instances of `userkins` to `mykins`.\n\n=== NOTES\n\n* The *fpin* pin is included to satisfy the requirements of the halcompile\n  utility but it is not accessible to kinematics functions.\n* HAL pins and parameters needed in kinematics functions (kinematicsForward(),\n  kinematicsInverse()) must be setup in a function (*userkins_setup()*) invoked\n  by the initial motion module call to kinematicsType().\n\n",
          license: "GPL",
          author: "Dewey Garrett",
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
            'component userkins"Template for user-built kinematics";\n\ndescription\n"""\nThe userkins.comp file is a template for creating kinematics that can be user-built using halcompile.\n\nThe unmodified userkins component can be used as a kinematics file\nfor a machine with identity kinematics for an xyz machine employing 3 joints (motors).\n\n=== USAGE\n\nCopy the userkins.comp file to a user-owned directory (*mydir*). +\nNote: The userkins.comp file can be downloaded from:\n  `github.com/LinuxCNC/linuxcnc/raw/2.8/src/hal/components/userkins.comp`\nwhere \'2.8\' is the branch name (use \'master\' for the master branch).\nFor a RIP (run-in-place) build, the file is located in the git tree as:\n  `src/hal/components/userkins.comp`.\n\nEdit the functions kinematicsForward() and kinematicsInverse() as required.\n\nIf required, add HAL pins following examples in the template code.\n\nBuild and install the component using halcompile:\n\n[source,sh]\n----\n$ cd mydir\n$ [sudo] halcompile --install userkins.comp\n# Note:\n#      sudo is required when using a deb install\n#      sudo is *not* required for run-in-place builds\n# $ man halcompile for more info\n----\n\nSpecify userkins in an ini file as:\n\n[source,ini]\n----\n[KINS]\nKINEMATICS=userkins\nJOINTS=3\n# the number of JOINTS must agree with the\n# number of joints used in your modified userkins.comp\n----\n\nNote: the manpage for userkins is not updated by `halcompile --install`\n\nTo use a different component name, rename the file (example mykins.comp) and\nchange all instances of `userkins` to `mykins`.\n\n=== NOTES\n\n* The *fpin* pin is included to satisfy the requirements of the halcompile\n  utility but it is not accessible to kinematics functions.\n* HAL pins and parameters needed in kinematics functions (kinematicsForward(),\n  kinematicsInverse()) must be setup in a function (*userkins_setup()*) invoked\n  by the initial motion module call to kinematicsType().\n\n""";\n// The fpin pin is not accessible in kinematics functions.\n// Use the *_setup() function for pins and params used by kinematics.\npin out s32 fpin=0"pin to demonstrate use of a conventional (non-kinematics) function fdemo";\noption period no;\nfunction fdemo;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
  ],
};

export default history;
