import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "timedelay",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:timedelay:timedelay",
        name: "timedelay",
        halComponentName: "timedelay",
        source: "comp",
        sourcePath: "src/hal/components/timedelay.comp",
        docs: {
          component: "The equivalent of a time-delay relay",
          license: "GPL",
          author:
            "Jeff Epler, based on works by Stephen Wille Padnos and John Kasunich",
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
            doc: "Follows the value of \\\\fBin\\\\fR after applying the delays\n\\\\fBon-delay\\\\fR and \\\\fBoff-delay\\\\fR.",
            direction: "out",
          },
          {
            key: "on_delay",
            name: "on-delay",
            type: "float",
            doc: "The time, in seconds, for which \\\\fBin\\\\fR must be\n\\\\fBtrue\\\\fR before \\\\fBout\\\\fR becomes \\\\fBtrue\\\\fR",
            defaultValue: "0.5",
            direction: "in",
          },
          {
            key: "off_delay",
            name: "off-delay",
            type: "float",
            doc: "The time, in seconds, for which \\\\fBin\\\\fR must be\n\\\\fBfalse\\\\fR before \\\\fBout\\\\fR becomes \\\\fBfalse\\\\fR",
            defaultValue: "0.5",
            direction: "in",
          },
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal timer",
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
            'component timedelay "The equivalent of a time-delay relay";\n\npin in bit in;\npin out bit out """Follows the value of \\\\fBin\\\\fR after applying the delays\n\\\\fBon-delay\\\\fR and \\\\fBoff-delay\\\\fR.""";\n\npin in float on-delay = 0.5 """The time, in seconds, for which \\\\fBin\\\\fR must be\n\\\\fBtrue\\\\fR before \\\\fBout\\\\fR becomes \\\\fBtrue\\\\fR""";\npin in float off-delay = 0.5 """The time, in seconds, for which \\\\fBin\\\\fR must be\n\\\\fBfalse\\\\fR before \\\\fBout\\\\fR becomes \\\\fBfalse\\\\fR""";\n\npin out float elapsed "Current value of the internal timer";\nvariable double timer;\n\nfunction _;\n\nlicense "GPL";\nauthor "Jeff Epler, based on works by Stephen Wille Padnos and John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:timedelay:timedelay",
        name: "timedelay",
        halComponentName: "timedelay",
        source: "comp",
        sourcePath: "src/hal/components/timedelay.comp",
        docs: {
          component: "The equivalent of a time-delay relay",
          license: "GPL",
          author:
            "Jeff Epler, based on works by Stephen Wille Padnos and John Kasunich",
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
            doc: "Follows the value of *in* after applying the delays\n*on-delay* and *off-delay*.",
            direction: "out",
          },
          {
            key: "on_delay",
            name: "on-delay",
            type: "float",
            doc: "The time, in seconds, for which *in* must be\n*true* before *out* becomes *true*",
            defaultValue: "0.5",
            direction: "in",
          },
          {
            key: "off_delay",
            name: "off-delay",
            type: "float",
            doc: "The time, in seconds, for which *in* must be\n*false* before *out* becomes *false*",
            defaultValue: "0.5",
            direction: "in",
          },
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal timer",
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
            'component timedelay "The equivalent of a time-delay relay";\n\npin in bit in;\npin out bit out """Follows the value of *in* after applying the delays\n*on-delay* and *off-delay*.""";\n\npin in float on-delay = 0.5 """The time, in seconds, for which *in* must be\n*true* before *out* becomes *true*""";\npin in float off-delay = 0.5 """The time, in seconds, for which *in* must be\n*false* before *out* becomes *false*""";\n\npin out float elapsed "Current value of the internal timer";\nvariable double timer;\n\nfunction _;\n\nlicense "GPL";\nauthor "Jeff Epler, based on works by Stephen Wille Padnos and John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
