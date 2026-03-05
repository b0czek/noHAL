import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "toggle2nist",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:toggle2nist:toggle2nist",
        name: "toggle2nist",
        halComponentName: "toggle2nist",
        source: "comp",
        sourcePath: "src/hal/components/toggle2nist.comp",
        docs: {
          component: "toggle button to nist logic",
          description:
            "\ntoggle2nist can be used with a momentary push button connected to a\ntoggle component to control a device that has separate on and off inputs\nand has an is-on output. \nIf in changes states via the toggle output\n  If is-on is true then on is false and off is true. \n  If is-on is false the on true and off is false.\n",
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
            key: "is_on",
            name: "is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "on",
            name: "on",
            type: "bit",
            direction: "out",
          },
          {
            key: "off",
            name: "off",
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
            'component toggle2nist "toggle button to nist logic";\n\ndescription\n"""\ntoggle2nist can be used with a momentary push button connected to a\ntoggle component to control a device that has separate on and off inputs\nand has an is-on output. \nIf in changes states via the toggle output\n  If is-on is true then on is false and off is true. \n  If is-on is false the on true and off is false.\n""";\n\npin in  bit in;\npin in  bit is_on;\npin out bit on;\npin out bit off;\nvariable int old_in;\nvariable int to_state=0;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:toggle2nist:toggle2nist",
        name: "toggle2nist",
        halComponentName: "toggle2nist",
        source: "comp",
        sourcePath: "src/hal/components/toggle2nist.comp",
        docs: {
          component: "toggle button to nist logic",
          description:
            "\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output. \n\n\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is low: It sets \\\\fIon\\\\fR until \\\\fIis-on\\\\fR becomes high.\n\n\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is high: It sets \\\\fIoff\\\\fR until \\\\fIis-on\\\\fR becomes low.\n\n\n.PSPIC -L ../man/images/toggle2nist.ps\n",
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
            key: "is_on",
            name: "is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "on",
            name: "on",
            type: "bit",
            direction: "out",
          },
          {
            key: "off",
            name: "off",
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
            'component toggle2nist "toggle button to nist logic";\n\ndescription\n"""\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output. \n\n\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is low: It sets \\\\fIon\\\\fR until \\\\fIis-on\\\\fR becomes high.\n\n\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is high: It sets \\\\fIoff\\\\fR until \\\\fIis-on\\\\fR becomes low.\n\n\n.PSPIC -L ../man/images/toggle2nist.ps\n""";\n\npin in  bit in;\npin in  bit is_on;\npin out bit on;\npin out bit off;\nvariable int old_in;\nvariable int to_state=0;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:toggle2nist:toggle2nist",
        name: "toggle2nist",
        halComponentName: "toggle2nist",
        source: "comp",
        sourcePath: "src/hal/components/toggle2nist.comp",
        docs: {
          component: "toggle button to nist logic",
          description:
            "\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output. \n\n\\\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is low: It sets \\\\fIon\\\\fR until \\\\fIis-on\\\\fR becomes high.\n\n\\\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is high: It sets \\\\fIoff\\\\fR until \\\\fIis-on\\\\fR becomes low.\n\n\n       ┐     ┌─────xxxxxxxxxxxx┐           ┌─────xxxxxxxxxxxx┐\n.br\nin   : └─────┘     xxxxxxxxxxxx└───────────┘     xxxxxxxxxxxx└─────\n.br\n       ┐     ┌───────────┐\n.br\non   : └─────┘           └─────────────────────────────────────────\n.br\n       ┐                                   ┌───────────┐\n.br\noff  : └───────────────────────────────────┘           └───────────\n.br\n       ┐                 ┌─────────────────────────────┐\n.br\nis-on: └─────────────────┘                             └───────────\n\n",
          license: "GPL",
          author: "Anders Wallin",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "is_on",
            name: "is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "on",
            name: "on",
            type: "bit",
            direction: "out",
          },
          {
            key: "off",
            name: "off",
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
            'component toggle2nist "toggle button to nist logic";\n\ndescription\n"""\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output. \n\n\\\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is low: It sets \\\\fIon\\\\fR until \\\\fIis-on\\\\fR becomes high.\n\n\\\\[bu] On a rising edge on pin \\\\fIin\\\\fR when \\\\fIis-on\\\\fR is high: It sets \\\\fIoff\\\\fR until \\\\fIis-on\\\\fR becomes low.\n\n\n       ┐     ┌─────xxxxxxxxxxxx┐           ┌─────xxxxxxxxxxxx┐\n.br\nin   : └─────┘     xxxxxxxxxxxx└───────────┘     xxxxxxxxxxxx└─────\n.br\n       ┐     ┌───────────┐\n.br\non   : └─────┘           └─────────────────────────────────────────\n.br\n       ┐                                   ┌───────────┐\n.br\noff  : └───────────────────────────────────┘           └───────────\n.br\n       ┐                 ┌─────────────────────────────┐\n.br\nis-on: └─────────────────┘                             └───────────\n\n""";\n\npin in  bit in;\npin in  bit is_on;\npin out bit on;\npin out bit off;\nvariable int old_in;\nvariable int to_state=0;\nfunction _ nofp;\nlicense "GPL";\nauthor "Anders Wallin";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:toggle2nist:toggle2nist",
        name: "toggle2nist",
        halComponentName: "toggle2nist",
        source: "comp",
        sourcePath: "src/hal/components/toggle2nist.comp",
        docs: {
          component: "toggle button to nist logic",
          description:
            "\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output.\nA debounce delay in cycles can be set for 'in'. (default = 2)\n\n* On a rising edge on pin *in* when *is-on* is low: It sets *on* until *is-on* becomes high.\n* On a rising edge on pin *in* when *is-on* is high: It sets *off* until *is-on* becomes low.\n\n....\n       ┐     ┌─────xxxxxxxxxxxx┐           ┌─────xxxxxxxxxxxx┐\nin   : └─────┘     xxxxxxxxxxxx└───────────┘     xxxxxxxxxxxx└─────\n\n       ┐     ┌───────────┐\non   : └─────┘           └─────────────────────────────────────────\n\n       ┐                                   ┌───────────┐\noff  : └───────────────────────────────────┘           └───────────\n\n       ┐                 ┌─────────────────────────────┐\nis-on: └─────────────────┘                             └───────────\n....\n\n",
          license: "GPL",
          author: "Anders Wallin, David Mueller",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "momentary button in",
            direction: "in",
          },
          {
            key: "is_on",
            name: "is-on",
            type: "bit",
            doc: "current state of device",
            direction: "in",
          },
          {
            key: "debounce",
            name: "debounce",
            type: "u32",
            doc: "debounce delay for 'in'-pin in cycles",
            defaultValue: "2",
            direction: "in",
          },
          {
            key: "on",
            name: "on",
            type: "bit",
            doc: "turn device on",
            direction: "out",
          },
          {
            key: "off",
            name: "off",
            type: "bit",
            doc: "turn device off",
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
            'component toggle2nist "toggle button to nist logic";\n\ndescription\n"""\nToggle2nist can be used with a momentary push button \nto control a device that has separate on and off inputs\nand an is-on output.\nA debounce delay in cycles can be set for \'in\'. (default = 2)\n\n* On a rising edge on pin *in* when *is-on* is low: It sets *on* until *is-on* becomes high.\n* On a rising edge on pin *in* when *is-on* is high: It sets *off* until *is-on* becomes low.\n\n....\n       ┐     ┌─────xxxxxxxxxxxx┐           ┌─────xxxxxxxxxxxx┐\nin   : └─────┘     xxxxxxxxxxxx└───────────┘     xxxxxxxxxxxx└─────\n\n       ┐     ┌───────────┐\non   : └─────┘           └─────────────────────────────────────────\n\n       ┐                                   ┌───────────┐\noff  : └───────────────────────────────────┘           └───────────\n\n       ┐                 ┌─────────────────────────────┐\nis-on: └─────────────────┘                             └───────────\n....\n\n""";\n\npin in bit in  "momentary button in";\npin in bit is_on "current state of device";\npin in unsigned debounce = 2 "debounce delay for \'in\'-pin in cycles";\npin out bit on "turn device on";\npin out bit off "turn device off";\nvariable int debounce_cntr;\nvariable unsigned debounce_set;\nvariable int state;\n\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "Anders Wallin, David Mueller";\n',
        },
      },
    },
  ],
};

export default history;
