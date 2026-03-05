import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "sim_home_switch",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:sim-home-switch:sim-home-switch",
        name: "sim_home_switch",
        halComponentName: "sim_home_switch",
        source: "comp",
        sourcePath: "src/hal/components/sim_home_switch.comp",
        docs: {
          component: "Simple home switch simulator",
          description:
            "\nAfter tripping home switch, travel in opposite direction is required (amount set by the hysteresis pin)\n",
          license: "GPL",
        },
        pins: [
          {
            key: "cur_pos",
            name: "cur-pos",
            type: "float",
            doc: "Current position (typically: axis.n.motor-pos-fb)",
            direction: "in",
          },
          {
            key: "home_pos",
            name: "home-pos",
            type: "float",
            doc: "Home switch position",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "hysteresis",
            name: "hysteresis",
            type: "float",
            doc: "Travel required to backoff (hysteresis)",
            defaultValue: "0.1",
            direction: "in",
          },
          {
            key: "home_sw",
            name: "home-sw",
            type: "bit",
            doc: "Home switch activated",
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
            'component sim_home_switch "Simple home switch simulator";\n\ndescription\n"""\nAfter tripping home switch, travel in opposite direction is required (amount set by the hysteresis pin)\n""";\npin in float cur_pos "Current position (typically: axis.n.motor-pos-fb)";\npin in float home_pos = 1 "Home switch position";\npin in float hysteresis = 0.1"Travel required to backoff (hysteresis)";\npin out bit  home_sw"Home switch activated";\n\nfunction _ fp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:sim-home-switch:sim-home-switch",
        name: "sim_home_switch",
        halComponentName: "sim_home_switch",
        source: "comp",
        sourcePath: "src/hal/components/sim_home_switch.comp",
        docs: {
          component: "Simple home switch simulator",
          description:
            "\nAfter tripping home switch, travel in opposite direction is required (amount set by the hysteresis pin)\n",
          license: "GPL",
        },
        pins: [
          {
            key: "cur_pos",
            name: "cur-pos",
            type: "float",
            doc: "Current position (typically: joint.n.motor-pos-fb)",
            direction: "in",
          },
          {
            key: "home_pos",
            name: "home-pos",
            type: "float",
            doc: "Home switch position",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "hysteresis",
            name: "hysteresis",
            type: "float",
            doc: "Travel required to backoff (hysteresis)",
            defaultValue: "0.1",
            direction: "in",
          },
          {
            key: "home_sw",
            name: "home-sw",
            type: "bit",
            doc: "Home switch activated",
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
            'component sim_home_switch "Simple home switch simulator";\n\ndescription\n"""\nAfter tripping home switch, travel in opposite direction is required (amount set by the hysteresis pin)\n""";\npin in float cur_pos "Current position (typically: joint.n.motor-pos-fb)";\npin in float home_pos = 1 "Home switch position";\npin in float hysteresis = 0.1"Travel required to backoff (hysteresis)";\npin out bit  home_sw"Home switch activated";\n\nfunction _ fp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:sim-home-switch:sim-home-switch",
        name: "sim_home_switch",
        halComponentName: "sim_home_switch",
        source: "comp",
        sourcePath: "src/hal/components/sim_home_switch.comp",
        docs: {
          component: "Home switch simulator",
          description:
            "\nAfter tripping home switch, travel in opposite direction is\nrequired (amount set by the hysteresis pin).\nA pin (index-enable) is provided for use when\n\\\\fB[JOINT_n]HOME_USE_INDEX\\\\fR is specified to reset\nthe I/O pin \\\\fBjoint.N.index-enable\\\\fR.\n",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "cur_pos",
            name: "cur-pos",
            type: "float",
            doc: "Current position (typically: joint.n.motor-pos-fb)",
            direction: "in",
          },
          {
            key: "home_pos",
            name: "home-pos",
            type: "float",
            doc: "Home switch position",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "hysteresis",
            name: "hysteresis",
            type: "float",
            doc: "Travel required to backoff (hysteresis)",
            defaultValue: "0.1",
            direction: "in",
          },
          {
            key: "home_sw",
            name: "home-sw",
            type: "bit",
            doc: "Home switch activated",
            direction: "out",
          },
          {
            key: "index_enable",
            name: "index-enable",
            type: "bit",
            doc: "typ: connect to joint.N.index-enable",
            direction: "io",
          },
          {
            key: "index_delay_ms",
            name: "index-delay-ms",
            type: "float",
            doc: "delay in msec to reset index-enable",
            defaultValue: "10",
            direction: "in",
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
            'component sim_home_switch "Home switch simulator";\n\ndescription\n"""\nAfter tripping home switch, travel in opposite direction is\nrequired (amount set by the hysteresis pin).\nA pin (index-enable) is provided for use when\n\\\\fB[JOINT_n]HOME_USE_INDEX\\\\fR is specified to reset\nthe I/O pin \\\\fBjoint.N.index-enable\\\\fR.\n""";\npin in float cur_pos "Current position (typically: joint.n.motor-pos-fb)";\npin in float home_pos = 1 "Home switch position";\npin in float hysteresis = 0.1"Travel required to backoff (hysteresis)";\npin out bit  home_sw"Home switch activated";\n\npin io  bit  index_enable "typ: connect to joint.N.index-enable";\npin in float index_delay_ms = 10 "delay in msec to reset index-enable";\n\nvariable int    old_index_enable;\nvariable double index_timer_ms;\n\nfunction _ fp;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:sim-home-switch:sim-home-switch",
        name: "sim_home_switch",
        halComponentName: "sim_home_switch",
        source: "comp",
        sourcePath: "src/hal/components/sim_home_switch.comp",
        docs: {
          component: "Home switch simulator",
          description:
            "\nAfter tripping home switch, travel in opposite direction is\nrequired (amount set by the hysteresis pin).\nA pin (index-enable) is provided for use when\n*[JOINT_n]HOME_USE_INDEX* is specified to reset\nthe I/O pin *joint.N.index-enable*.\n",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "cur_pos",
            name: "cur-pos",
            type: "float",
            doc: "Current position (typically: joint.n.motor-pos-fb)",
            direction: "in",
          },
          {
            key: "home_pos",
            name: "home-pos",
            type: "float",
            doc: "Home switch position",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "hysteresis",
            name: "hysteresis",
            type: "float",
            doc: "Travel required to backoff (hysteresis)",
            defaultValue: "0.1",
            direction: "in",
          },
          {
            key: "home_sw",
            name: "home-sw",
            type: "bit",
            doc: "Home switch activated",
            direction: "out",
          },
          {
            key: "index_enable",
            name: "index-enable",
            type: "bit",
            doc: "typ: connect to joint.N.index-enable",
            direction: "io",
          },
          {
            key: "index_delay_ms",
            name: "index-delay-ms",
            type: "float",
            doc: "delay in msec to reset index-enable",
            defaultValue: "10",
            direction: "in",
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
            'component sim_home_switch "Home switch simulator";\n\ndescription\n"""\nAfter tripping home switch, travel in opposite direction is\nrequired (amount set by the hysteresis pin).\nA pin (index-enable) is provided for use when\n*[JOINT_n]HOME_USE_INDEX* is specified to reset\nthe I/O pin *joint.N.index-enable*.\n""";\npin in float cur_pos "Current position (typically: joint.n.motor-pos-fb)";\npin in float home_pos = 1 "Home switch position";\npin in float hysteresis = 0.1"Travel required to backoff (hysteresis)";\npin out bit  home_sw"Home switch activated";\n\npin io  bit  index_enable "typ: connect to joint.N.index-enable";\npin in float index_delay_ms = 10 "delay in msec to reset index-enable";\n\nvariable int    old_index_enable;\nvariable double index_timer_ms;\n\nfunction _ fp;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
  ],
};

export default history;
