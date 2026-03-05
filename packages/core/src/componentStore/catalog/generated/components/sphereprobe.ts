import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "sphereprobe",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:sphereprobe:sphereprobe",
        name: "sphereprobe",
        halComponentName: "sphereprobe",
        source: "comp",
        sourcePath: "src/hal/components/sphereprobe.comp",
        docs: {
          component: "Probe a pretend hemisphere",
          author: "Jeff Epler",
          license: "GPL",
        },
        pins: [
          {
            key: "px",
            name: "px",
            type: "s32",
            direction: "in",
          },
          {
            key: "py",
            name: "py",
            type: "s32",
            direction: "in",
          },
          {
            key: "pz",
            name: "pz",
            type: "s32",
            doc: "\\fBrawcounts\\fR position from software encoder",
            direction: "in",
          },
          {
            key: "cx",
            name: "cx",
            type: "s32",
            direction: "in",
          },
          {
            key: "cy",
            name: "cy",
            type: "s32",
            direction: "in",
          },
          {
            key: "cz",
            name: "cz",
            type: "s32",
            doc: "Center of sphere in counts",
            direction: "in",
          },
          {
            key: "r",
            name: "r",
            type: "s32",
            doc: "Radius of hemisphere in counts",
            direction: "in",
          },
          {
            key: "probe_out",
            name: "probe-out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "update probe-out based on inputs",
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
            'component sphereprobe "Probe a pretend hemisphere";\nauthor "Jeff Epler";\nlicense "GPL";\n\npin in signed px;\npin in signed py;\npin in signed pz "\\\\fBrawcounts\\\\fR position from software encoder";\n\npin in signed cx;\npin in signed cy;\npin in signed cz "Center of sphere in counts";\npin in signed r "Radius of hemisphere in counts";\n\npin out bit probe-out;\n\nfunction _ nofp "update probe-out based on inputs";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:sphereprobe:sphereprobe",
        name: "sphereprobe",
        halComponentName: "sphereprobe",
        source: "comp",
        sourcePath: "src/hal/components/sphereprobe.comp",
        docs: {
          component: "Probe a pretend hemisphere",
          author: "Jeff Epler",
          license: "GPL",
        },
        pins: [
          {
            key: "px",
            name: "px",
            type: "s32",
            direction: "in",
          },
          {
            key: "py",
            name: "py",
            type: "s32",
            direction: "in",
          },
          {
            key: "pz",
            name: "pz",
            type: "s32",
            doc: "*rawcounts* position from software encoder",
            direction: "in",
          },
          {
            key: "cx",
            name: "cx",
            type: "s32",
            direction: "in",
          },
          {
            key: "cy",
            name: "cy",
            type: "s32",
            direction: "in",
          },
          {
            key: "cz",
            name: "cz",
            type: "s32",
            doc: "Center of sphere in counts",
            direction: "in",
          },
          {
            key: "r",
            name: "r",
            type: "s32",
            doc: "Radius of hemisphere in counts",
            direction: "in",
          },
          {
            key: "probe_out",
            name: "probe-out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "update probe-out based on inputs",
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
            'component sphereprobe "Probe a pretend hemisphere";\nauthor "Jeff Epler";\nlicense "GPL";\n\npin in signed px;\npin in signed py;\npin in signed pz "*rawcounts* position from software encoder";\n\npin in signed cx;\npin in signed cy;\npin in signed cz "Center of sphere in counts";\npin in signed r "Radius of hemisphere in counts";\n\npin out bit probe-out;\n\noption period no;\nfunction _ nofp "update probe-out based on inputs";\n',
        },
      },
    },
  ],
};

export default history;
