import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "dbounce",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:dbounce:dbounce",
        name: "dbounce",
        halComponentName: "dbounce",
        source: "comp",
        sourcePath: "src/hal/components/dbounce.comp",
        docs: {
          component:
            "alternative debounce component\\n\nThis component is similar to the \\\\fBdebounce\\\\fR component\\n\n(man \\\\fBdebounce\\\\fR) but uses settable delay pins for each instance\\n\nand supports \\\\fBcount\\\\fR= or \\\\fBnames\\\\fR= parameters\\n\n(groups are not used)",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
          {
            key: "delay",
            name: "delay",
            type: "u32",
            defaultValue: "5",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component dbounce """alternative debounce component\\n\nThis component is similar to the \\\\fBdebounce\\\\fR component\\n\n(man \\\\fBdebounce\\\\fR) but uses settable delay pins for each instance\\n\nand supports \\\\fBcount\\\\fR= or \\\\fBnames\\\\fR= parameters\\n\n(groups are not used)""";\n\npin in  bit in;\npin out bit out;\npin in  u32 delay = 5;\n\nvariable int state;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:dbounce:dbounce",
        name: "dbounce",
        halComponentName: "dbounce",
        source: "comp",
        sourcePath: "src/hal/components/dbounce.comp",
        docs: {
          component:
            "alternative debounce component\\n\nThis component is similar to the \\\\fBdebounce\\\\fR component\\n\n(man \\\\fBdebounce\\\\fR) but uses settable delay pins for each instance\\n\nand supports \\\\fBcount\\\\fR= or \\\\fBnames\\\\fR= parameters\\n\n(groups are not used)",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
          {
            key: "delay",
            name: "delay",
            type: "u32",
            defaultValue: "5",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component dbounce """alternative debounce component\\n\nThis component is similar to the \\\\fBdebounce\\\\fR component\\n\n(man \\\\fBdebounce\\\\fR) but uses settable delay pins for each instance\\n\nand supports \\\\fBcount\\\\fR= or \\\\fBnames\\\\fR= parameters\\n\n(groups are not used)""";\n\npin in  bit in;\npin out bit out;\npin in  u32 delay = 5;\n\nvariable int state;\nfunction _ nofp;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:dbounce:dbounce",
        name: "dbounce",
        halComponentName: "dbounce",
        source: "comp",
        sourcePath: "src/hal/components/dbounce.comp",
        docs: {
          component: "alternative debounce component",
          description:
            "\nThis component is similar to the *debounce*(9) component but uses settable\ndelay pins for each instance and supports *count*= or *names*= parameters\n(groups are not used)\n",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
          {
            key: "delay",
            name: "delay",
            type: "u32",
            defaultValue: "5",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component dbounce """alternative debounce component""";\ndescription """\nThis component is similar to the *debounce*(9) component but uses settable\ndelay pins for each instance and supports *count*= or *names*= parameters\n(groups are not used)\n""";\n\npin in  bit in;\npin out bit out;\npin in  u32 delay = 5;\n\nvariable unsigned state;\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
  ],
};

export default history;
