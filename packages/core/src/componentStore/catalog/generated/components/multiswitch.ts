import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "multiswitch",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:multiswitch:multiswitch",
        name: "multiswitch",
        halComponentName: "multiswitch",
        source: "comp",
        sourcePath: "src/hal/components/multiswitch.comp",
        docs: {
          component:
            "This component toggles between a specified number of output bits",
          author:
            "ArcEye schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org",
          license: "GPL",
        },
        pins: [
          {
            key: "up",
            name: "up",
            type: "bit",
            doc: "Receives signal to toggle up",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "down",
            name: "down",
            type: "bit",
            doc: "Receives signal to toggle down",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "bit_idxidx",
            name: "bit-##",
            type: "bit",
            doc: "Output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            defaultValue: "false",
            direction: "out",
          },
        ],
        params: [
          {
            key: "top_position",
            name: "top-position",
            type: "u32",
            doc: "Number of positions",
            direction: "rw",
          },
          {
            key: "position",
            name: "position",
            type: "s32",
            doc: "Current state (may be set in the HAL)",
            direction: "rw",
          },
        ],
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
            extra_setup: true,
            count_function: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/*******************************************************************************\n\nEMC2 HAL component to implement Multistate toggle switch\nAuthors ArcEye 15122011 schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org\nLicense GPL\nCopyright 2011 \n\nexample Hal linkages required:-\n################################\nloadrt multiswitch cfg=4,6,8\naddf multiswitch.0 servo-thread\n...\nnet toggle-switch multiswitch.0.toggle <= parport.N.pin-nn-out\nnet state1 multiswitch.0.state1 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state2 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state3 => parport.N.pin-nn-in\n\nIf you require an "all off" state, then make the component one bit oversize and\ndon\'t connect the extra pin. \n\n*******************************************************************************/\n\ncomponent multiswitch           """This component toggles between a specified number of output bits""";\n\npin in bit up = false           "Receives signal to toggle up";\npin in bit down = false         "Receives signal to toggle down";\n\nparam rw unsigned top-position  "Number of positions";\nparam rw signed position      "Current state (may be set in the HAL)";\n\npin out bit bit-##[32:personality] = false       "Output bits";\n\nmodparam dummy cfg              """cfg should be a comma-separated list of sizes\nfor example cfg=2,4,6 would create 3 instances of 2, 4 and 6 bits respectively.\n Ignore the "personality" parameter, that is auto-generated""";\n\nfunction _ ;\noption extra_setup yes;\noption count_function yes;\n\nvariable int old_up = 0;\nvariable int old_down = 0;\n\nauthor "ArcEye schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:multiswitch:multiswitch",
        name: "multiswitch",
        halComponentName: "multiswitch",
        source: "comp",
        sourcePath: "src/hal/components/multiswitch.comp",
        docs: {
          component:
            "This component toggles between a specified number of output bits.",
          author:
            "ArcEye schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org",
          license: "GPL",
        },
        pins: [
          {
            key: "up",
            name: "up",
            type: "bit",
            doc: "Receives signal to toggle up",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "down",
            name: "down",
            type: "bit",
            doc: "Receives signal to toggle down",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "bit_idxidx",
            name: "bit-##",
            type: "bit",
            doc: "Output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            defaultValue: "false",
            direction: "out",
          },
        ],
        params: [
          {
            key: "top_position",
            name: "top-position",
            type: "u32",
            doc: "Number of positions",
            direction: "rw",
          },
          {
            key: "position",
            name: "position",
            type: "s32",
            doc: "Current state (may be set in the HAL)",
            direction: "rw",
          },
        ],
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
            extra_setup: true,
            count_function: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/*******************************************************************************\n\nLinuxCNC HAL component to implement Multistate toggle switch\nAuthors ArcEye 15122011 schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org\nLicense GPL\nCopyright 2011 \n\nexample Hal linkages required:-\n################################\nloadrt multiswitch cfg=4,6,8\naddf multiswitch.0 servo-thread\n...\nnet toggle-switch multiswitch.0.toggle <= parport.N.pin-nn-out\nnet state1 multiswitch.0.state1 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state2 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state3 => parport.N.pin-nn-in\n\nIf you require an "all off" state, then make the component one bit oversize and\ndon\'t connect the extra pin. \n\n*******************************************************************************/\n\ncomponent multiswitch           """This component toggles between a specified number of output bits.""";\n\npin in bit up = false           "Receives signal to toggle up";\npin in bit down = false         "Receives signal to toggle down";\n\nparam rw unsigned top-position  "Number of positions";\nparam rw signed position      "Current state (may be set in the HAL)";\n\npin out bit bit-##[32:personality] = false       "Output bits";\n\nmodparam dummy cfg              """cfg should be a comma-separated list of sizes, for example cfg=2,4,6 would create 3 instances of 2, 4 and 6 bits respectively.\nIgnore the "personality" parameter, that is auto-generated.""";\n\nfunction _ ;\noption extra_setup yes;\noption count_function yes;\n\nvariable int old_up = 0;\nvariable int old_down = 0;\n\nauthor "ArcEye schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:multiswitch:multiswitch",
        name: "multiswitch",
        halComponentName: "multiswitch",
        source: "comp",
        sourcePath: "src/hal/components/multiswitch.comp",
        docs: {
          component:
            "This component toggles between a specified number of output bits.",
          author:
            "ArcEye schooner30.AT.tiscali.co.uk / Andy Pugh andy.AT.bodgesoc.org",
          license: "GPL",
        },
        pins: [
          {
            key: "up",
            name: "up",
            type: "bit",
            doc: "Receives signal to toggle up",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "down",
            name: "down",
            type: "bit",
            doc: "Receives signal to toggle down",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "bit_idxidx",
            name: "bit-##",
            type: "bit",
            doc: "Output bits",
            arrayLen: 32,
            arrayExpr: "personality",
            defaultValue: "false",
            direction: "out",
          },
        ],
        params: [
          {
            key: "top_position",
            name: "top-position",
            type: "u32",
            doc: "Number of positions",
            direction: "rw",
          },
          {
            key: "position",
            name: "position",
            type: "s32",
            doc: "Current state (may be set in the HAL)",
            direction: "rw",
          },
        ],
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
            extra_setup: true,
            count_function: true,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/*******************************************************************************\n\nLinuxCNC HAL component to implement Multistate toggle switch\nAuthors ArcEye 15122011 schooner30@tiscali.co.uk / Andy Pugh andy@bodgesoc.org\nLicense GPL\nCopyright 2011 \n\nexample HAL linkages required:-\n################################\nloadrt multiswitch cfg=4,6,8\naddf multiswitch.0 servo-thread\n...\nnet toggle-switch multiswitch.0.toggle <= parport.N.pin-nn-out\nnet state1 multiswitch.0.state1 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state2 => parport.N.pin-nn-in\nnet state1 multiswitch.0.state3 => parport.N.pin-nn-in\n\nIf you require an "all off" state, then make the component one bit oversize and\ndon\'t connect the extra pin. \n\n*******************************************************************************/\n\ncomponent multiswitch           """This component toggles between a specified number of output bits.""";\n\npin in bit up = false           "Receives signal to toggle up";\npin in bit down = false         "Receives signal to toggle down";\n\nparam rw unsigned top-position  "Number of positions";\nparam rw signed position      "Current state (may be set in the HAL)";\n\npin out bit bit-##[32:personality] = false       "Output bits";\n\nmodparam dummy cfg              """cfg should be a comma-separated list of sizes, for example cfg=2,4,6 would create 3 instances of 2, 4 and 6 bits respectively.\nIgnore the "personality" parameter, that is auto-generated.""";\n\nfunction _ ;\noption extra_setup yes;\noption count_function yes;\noption period no;\n\nvariable int old_up = 0;\nvariable int old_down = 0;\n\nauthor "ArcEye schooner30.AT.tiscali.co.uk / Andy Pugh andy.AT.bodgesoc.org";\nlicense "GPL";\n',
        },
      },
    },
  ],
};

export default history;
