import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "corexy_by_hal",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:corexy-by-hal:corexy-by-hal",
        name: "corexy_by_hal",
        halComponentName: "corexy_by_hal",
        source: "comp",
        sourcePath: "src/hal/components/corexy_by_hal.comp",
        docs: {
          component: "CoreXY kinematics",
          description:
            "\nImplement \\\\fBCoreXY\\\\fR forward and inverse transformations\n\\\\fBin HAL\\\\fR.  This component provides an alternative\nmethod for implementing \\\\fBCoreXY\\\\fR kinematics.\n\nIn the INI file, use:\n\n\\\\fB[KINS]KINEMATICS=trivkins coordinates=xyz kinstype=both\\\\fR\n\nThis component accepts two joint (\\\\fBj0,j1\\\\fR) motor\nposition commands for a trivkins coordinates=xyz configuration\nand computes equivalent \\\\fBCoreXY\\\\fR motor commands for\ntwo motors identified as \\\\fBalpha,beta\\\\fR.  Similarly,\nthe component accepts feedback values for the\n\\\\fBalpha,beta\\\\fR motor controllers and converts to\nequivalent joint (\\\\fBj0,j1\\\\fR) motor position feedback values.\n\nNotes:\n\n1) Using \\\\fBtrivkins\\\\fR with this module allows home switches\nto trigger according to the \\\\fBCartesian x,y\\\\fR positions\n\n2) Joint pin names are based on \\\\fBcoordinates=xyz\\\\fR and\nthe corresponding joint number assignments used by\n\\\\fBtrivkins\\\\fR so \\\\fBj0==x, j1==y\\\\fR\n(man trivkins for more information)\n\n3) \\\\fBCoreXY\\\\fR kinematics can also be implemented using\nthe kinematics module named \\\\fBcorexykins\\\\fR with home\nswitches triggered by the \\\\fB j0,j1 motor\\\\fR positions.\n(man kins for more information)\n",
          license: "GPL",
        },
        pins: [
          {
            key: "alpha_fb",
            name: "alpha-fb",
            type: "float",
            doc: "typ: feedback from alpha motor controller",
            direction: "in",
          },
          {
            key: "beta_fb",
            name: "beta-fb",
            type: "float",
            doc: "typ: feedback from beta  motor controller",
            direction: "in",
          },
          {
            key: "j0_motor_pos_cmd",
            name: "j0-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.0.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j1_motor_pos_cmd",
            name: "j1-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.1.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j0_motor_pos_fb",
            name: "j0-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.0.motor-pos-fb",
            direction: "out",
          },
          {
            key: "j1_motor_pos_fb",
            name: "j1-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.1.motor-pos-fb",
            direction: "out",
          },
          {
            key: "alpha_cmd",
            name: "alpha-cmd",
            type: "float",
            doc: "typ: command to alpha motor",
            direction: "out",
          },
          {
            key: "beta_cmd",
            name: "beta-cmd",
            type: "float",
            doc: "typ: command to beta ts motor",
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
            '// Based on a forum posting by nbremond\ncomponent corexy_by_hal "CoreXY kinematics";\n\npin in float  alpha_fb"typ: feedback from alpha motor controller";\npin in float  beta_fb "typ: feedback from beta  motor controller";\n\npin in float  j0_motor_pos_cmd"typ: from joint.0.motor-pos-cmd";\npin in float  j1_motor_pos_cmd"typ: from joint.1.motor-pos-cmd";\n\npin out float j0_motor_pos_fb"typ: to joint.0.motor-pos-fb";\npin out float j1_motor_pos_fb"typ: to joint.1.motor-pos-fb";\n\npin out float alpha_cmd"typ: command to alpha motor";\npin out float beta_cmd "typ: command to beta ts motor";\n\nfunction _;\ndescription """\nImplement \\\\fBCoreXY\\\\fR forward and inverse transformations\n\\\\fBin HAL\\\\fR.  This component provides an alternative\nmethod for implementing \\\\fBCoreXY\\\\fR kinematics.\n\nIn the INI file, use:\n\n\\\\fB[KINS]KINEMATICS=trivkins coordinates=xyz kinstype=both\\\\fR\n\nThis component accepts two joint (\\\\fBj0,j1\\\\fR) motor\nposition commands for a trivkins coordinates=xyz configuration\nand computes equivalent \\\\fBCoreXY\\\\fR motor commands for\ntwo motors identified as \\\\fBalpha,beta\\\\fR.  Similarly,\nthe component accepts feedback values for the\n\\\\fBalpha,beta\\\\fR motor controllers and converts to\nequivalent joint (\\\\fBj0,j1\\\\fR) motor position feedback values.\n\nNotes:\n\n1) Using \\\\fBtrivkins\\\\fR with this module allows home switches\nto trigger according to the \\\\fBCartesian x,y\\\\fR positions\n\n2) Joint pin names are based on \\\\fBcoordinates=xyz\\\\fR and\nthe corresponding joint number assignments used by\n\\\\fBtrivkins\\\\fR so \\\\fBj0==x, j1==y\\\\fR\n(man trivkins for more information)\n\n3) \\\\fBCoreXY\\\\fR kinematics can also be implemented using\nthe kinematics module named \\\\fBcorexykins\\\\fR with home\nswitches triggered by the \\\\fB j0,j1 motor\\\\fR positions.\n(man kins for more information)\n""";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:corexy-by-hal:corexy-by-hal",
        name: "corexy_by_hal",
        halComponentName: "corexy_by_hal",
        source: "comp",
        sourcePath: "src/hal/components/corexy_by_hal.comp",
        docs: {
          component: "CoreXY kinematics",
          description:
            "\nImplement \\\\fBCoreXY\\\\fR forward and inverse transformations\n\\\\fBin HAL\\\\fR.  This component provides an alternative\nmethod for implementing \\\\fBCoreXY\\\\fR kinematics.\n\nIn the INI file, use:\n\n\\\\fB[KINS]KINEMATICS=trivkins coordinates=xyz kinstype=both\\\\fR\n\nThis component accepts two joint (\\\\fBj0,j1\\\\fR) motor\nposition commands for a trivkins coordinates=xyz configuration\nand computes equivalent \\\\fBCoreXY\\\\fR motor commands for\ntwo motors identified as \\\\fBalpha,beta\\\\fR.  Similarly,\nthe component accepts feedback values for the\n\\\\fBalpha,beta\\\\fR motor controllers and converts to\nequivalent joint (\\\\fBj0,j1\\\\fR) motor position feedback values.\n\nNotes:\n\n1) Using \\\\fBtrivkins\\\\fR with this module allows home switches\nto trigger according to the \\\\fBCartesian x,y\\\\fR positions\n\n2) Joint pin names are based on \\\\fBcoordinates=xyz\\\\fR and\nthe corresponding joint number assignments used by\n\\\\fBtrivkins\\\\fR so \\\\fBj0==x, j1==y\\\\fR\n(man trivkins for more information)\n\n3) \\\\fBCoreXY\\\\fR kinematics can also be implemented using\nthe kinematics module named \\\\fBcorexykins\\\\fR with home\nswitches triggered by the \\\\fB j0,j1 motor\\\\fR positions.\n(man kins for more information)\n",
          license: "GPL",
          author: "Dewey Garrett based on forum post from nbremond",
        },
        pins: [
          {
            key: "alpha_fb",
            name: "alpha-fb",
            type: "float",
            doc: "typ: feedback from alpha motor controller",
            direction: "in",
          },
          {
            key: "beta_fb",
            name: "beta-fb",
            type: "float",
            doc: "typ: feedback from beta  motor controller",
            direction: "in",
          },
          {
            key: "j0_motor_pos_cmd",
            name: "j0-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.0.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j1_motor_pos_cmd",
            name: "j1-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.1.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j0_motor_pos_fb",
            name: "j0-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.0.motor-pos-fb",
            direction: "out",
          },
          {
            key: "j1_motor_pos_fb",
            name: "j1-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.1.motor-pos-fb",
            direction: "out",
          },
          {
            key: "alpha_cmd",
            name: "alpha-cmd",
            type: "float",
            doc: "typ: command to alpha motor",
            direction: "out",
          },
          {
            key: "beta_cmd",
            name: "beta-cmd",
            type: "float",
            doc: "typ: command to beta ts motor",
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
            '// Based on a forum posting by nbremond\ncomponent corexy_by_hal "CoreXY kinematics";\n\npin in float  alpha_fb"typ: feedback from alpha motor controller";\npin in float  beta_fb "typ: feedback from beta  motor controller";\n\npin in float  j0_motor_pos_cmd"typ: from joint.0.motor-pos-cmd";\npin in float  j1_motor_pos_cmd"typ: from joint.1.motor-pos-cmd";\n\npin out float j0_motor_pos_fb"typ: to joint.0.motor-pos-fb";\npin out float j1_motor_pos_fb"typ: to joint.1.motor-pos-fb";\n\npin out float alpha_cmd"typ: command to alpha motor";\npin out float beta_cmd "typ: command to beta ts motor";\n\nfunction _;\ndescription """\nImplement \\\\fBCoreXY\\\\fR forward and inverse transformations\n\\\\fBin HAL\\\\fR.  This component provides an alternative\nmethod for implementing \\\\fBCoreXY\\\\fR kinematics.\n\nIn the INI file, use:\n\n\\\\fB[KINS]KINEMATICS=trivkins coordinates=xyz kinstype=both\\\\fR\n\nThis component accepts two joint (\\\\fBj0,j1\\\\fR) motor\nposition commands for a trivkins coordinates=xyz configuration\nand computes equivalent \\\\fBCoreXY\\\\fR motor commands for\ntwo motors identified as \\\\fBalpha,beta\\\\fR.  Similarly,\nthe component accepts feedback values for the\n\\\\fBalpha,beta\\\\fR motor controllers and converts to\nequivalent joint (\\\\fBj0,j1\\\\fR) motor position feedback values.\n\nNotes:\n\n1) Using \\\\fBtrivkins\\\\fR with this module allows home switches\nto trigger according to the \\\\fBCartesian x,y\\\\fR positions\n\n2) Joint pin names are based on \\\\fBcoordinates=xyz\\\\fR and\nthe corresponding joint number assignments used by\n\\\\fBtrivkins\\\\fR so \\\\fBj0==x, j1==y\\\\fR\n(man trivkins for more information)\n\n3) \\\\fBCoreXY\\\\fR kinematics can also be implemented using\nthe kinematics module named \\\\fBcorexykins\\\\fR with home\nswitches triggered by the \\\\fB j0,j1 motor\\\\fR positions.\n(man kins for more information)\n""";\n\nlicense "GPL";\nauthor "Dewey Garrett based on forum post from nbremond";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:corexy-by-hal:corexy-by-hal",
        name: "corexy_by_hal",
        halComponentName: "corexy_by_hal",
        source: "comp",
        sourcePath: "src/hal/components/corexy_by_hal.comp",
        docs: {
          component: "CoreXY kinematics",
          description:
            "\nImplement *CoreXY* forward and inverse transformations\n*in HAL*.  This component provides an alternative\nmethod for implementing *CoreXY* kinematics.\n\nIn the INI file, use:\n\n[source,ini]\n----\n[KINS]\nKINEMATICS=trivkins\ncoordinates=xyz\nkinstype=both\n----\n\nThis component accepts two joint (*j0*, *j1*) motor position commands for a\ntrivkins coordinates=xyz configuration and computes equivalent *CoreXY* motor\ncommands for two motors identified as *alpha*, *beta*.  Similarly, the\ncomponent accepts feedback values for the *alpha,beta* motor controllers and\nconverts to equivalent joint (*j0*, *j1*) motor position feedback values.\n\nNotes:\n\n1. Using *trivkins* with this module allows home switches to trigger according\nto the *Cartesian x,y* positions\n\n2. Joint pin names are based on *coordinates=xyz* and the corresponding joint\nnumber assignments used by *trivkins* so *j0==x*, *j1==y* (see *trivkins*(9)).\n\n3. *CoreXY* kinematics can also be implemented using the kinematics module\nnamed *corexykins* with home switches triggered by the *j0*,*j1* *motor*\npositions (see *kins*(9)).\n\n",
          license: "GPL",
          author: "Dewey Garrett based on forum post from nbremond",
        },
        pins: [
          {
            key: "alpha_fb",
            name: "alpha-fb",
            type: "float",
            doc: "typ: feedback from alpha motor controller",
            direction: "in",
          },
          {
            key: "beta_fb",
            name: "beta-fb",
            type: "float",
            doc: "typ: feedback from beta  motor controller",
            direction: "in",
          },
          {
            key: "j0_motor_pos_cmd",
            name: "j0-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.0.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j1_motor_pos_cmd",
            name: "j1-motor-pos-cmd",
            type: "float",
            doc: "typ: from joint.1.motor-pos-cmd",
            direction: "in",
          },
          {
            key: "j0_motor_pos_fb",
            name: "j0-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.0.motor-pos-fb",
            direction: "out",
          },
          {
            key: "j1_motor_pos_fb",
            name: "j1-motor-pos-fb",
            type: "float",
            doc: "typ: to joint.1.motor-pos-fb",
            direction: "out",
          },
          {
            key: "alpha_cmd",
            name: "alpha-cmd",
            type: "float",
            doc: "typ: command to alpha motor",
            direction: "out",
          },
          {
            key: "beta_cmd",
            name: "beta-cmd",
            type: "float",
            doc: "typ: command to beta ts motor",
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
            '// Based on a forum posting by nbremond\ncomponent corexy_by_hal "CoreXY kinematics";\n\npin in float  alpha_fb"typ: feedback from alpha motor controller";\npin in float  beta_fb "typ: feedback from beta  motor controller";\n\npin in float  j0_motor_pos_cmd"typ: from joint.0.motor-pos-cmd";\npin in float  j1_motor_pos_cmd"typ: from joint.1.motor-pos-cmd";\n\npin out float j0_motor_pos_fb"typ: to joint.0.motor-pos-fb";\npin out float j1_motor_pos_fb"typ: to joint.1.motor-pos-fb";\n\npin out float alpha_cmd"typ: command to alpha motor";\npin out float beta_cmd "typ: command to beta ts motor";\n\nfunction _;\ndescription """\nImplement *CoreXY* forward and inverse transformations\n*in HAL*.  This component provides an alternative\nmethod for implementing *CoreXY* kinematics.\n\nIn the INI file, use:\n\n[source,ini]\n----\n[KINS]\nKINEMATICS=trivkins\ncoordinates=xyz\nkinstype=both\n----\n\nThis component accepts two joint (*j0*, *j1*) motor position commands for a\ntrivkins coordinates=xyz configuration and computes equivalent *CoreXY* motor\ncommands for two motors identified as *alpha*, *beta*.  Similarly, the\ncomponent accepts feedback values for the *alpha,beta* motor controllers and\nconverts to equivalent joint (*j0*, *j1*) motor position feedback values.\n\nNotes:\n\n1. Using *trivkins* with this module allows home switches to trigger according\nto the *Cartesian x,y* positions\n\n2. Joint pin names are based on *coordinates=xyz* and the corresponding joint\nnumber assignments used by *trivkins* so *j0==x*, *j1==y* (see *trivkins*(9)).\n\n3. *CoreXY* kinematics can also be implemented using the kinematics module\nnamed *corexykins* with home switches triggered by the *j0*,*j1* *motor*\npositions (see *kins*(9)).\n\n""";\n\noption period no;\nlicense "GPL";\nauthor "Dewey Garrett based on forum post from nbremond";\n',
        },
      },
    },
  ],
};

export default history;
