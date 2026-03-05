import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "ilowpass",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:ilowpass:ilowpass",
        name: "ilowpass",
        halComponentName: "ilowpass",
        source: "comp",
        sourcePath: "src/hal/components/ilowpass.comp",
        docs: {
          component: "Low-pass filter with integer inputs and outputs",
          description:
            "While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the \\\\fBilowpass\\\\fR component between the MPG\nencoder \\\\fBcounts\\\\fR output and the axis \\\\fRjog-counts\\\\fR input,\nthis can be smoothed.\n\nChoose \\\\fBscale\\\\fR conservatively so that during a single session\nthere will never be more than about 2e9/\\\\fBscale\\\\fR pulses seen\non the MPG.  Choose \\\\fBgain\\\\fR according to the smoothing level\ndesired.  Divide the \\\\fRaxis.\\\\fIN\\\\fR.jog-scale\\\\fR values by\n\\\\fBscale\\\\fR.",
          license: "GPL",
          author: "Jeff Epler <jepler@unpythonic.net>",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "\\\\fBout\\\\fR tracks \\\\fBin\\\\fR*\\\\fBscale\\\\fR through a low-pass\nfilter of \\\\fBgain\\\\fR per period.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "A scale factor applied to the output\nvalue of the low-pass filter.",
            defaultValue: "1024",
            direction: "rw",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            doc: "Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period",
            defaultValue: ".5",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the output based on the input and parameters",
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
            'component ilowpass "Low-pass filter with integer inputs and outputs";\ndescription """While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the \\\\fBilowpass\\\\fR component between the MPG\nencoder \\\\fBcounts\\\\fR output and the axis \\\\fRjog-counts\\\\fR input,\nthis can be smoothed.\n\nChoose \\\\fBscale\\\\fR conservatively so that during a single session\nthere will never be more than about 2e9/\\\\fBscale\\\\fR pulses seen\non the MPG.  Choose \\\\fBgain\\\\fR according to the smoothing level\ndesired.  Divide the \\\\fRaxis.\\\\fIN\\\\fR.jog-scale\\\\fR values by\n\\\\fBscale\\\\fR.""";\n\npin in s32 in;\n\npin out s32 out """\\\\fBout\\\\fR tracks \\\\fBin\\\\fR*\\\\fBscale\\\\fR through a low-pass\nfilter of \\\\fBgain\\\\fR per period.""";\n\nparam rw float scale = 1024 """A scale factor applied to the output\nvalue of the low-pass filter.""";\n\nparam rw float gain = .5 """Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period""";\n\nvariable double value;\n\nfunction _ "Update the output based on the input and parameters";\n\nlicense "GPL";\nauthor "Jeff Epler <jepler@unpythonic.net>";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:ilowpass:ilowpass",
        name: "ilowpass",
        halComponentName: "ilowpass",
        source: "comp",
        sourcePath: "src/hal/components/ilowpass.comp",
        docs: {
          component: "Low-pass filter with integer inputs and outputs",
          description:
            "While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the \\\\fBilowpass\\\\fR component between the MPG\nencoder \\\\fBcounts\\\\fR output and the axis \\\\fRjog-counts\\\\fR input,\nthis can be smoothed.\n\nChoose \\\\fBscale\\\\fR conservatively so that during a single session\nthere will never be more than about 2e9/\\\\fBscale\\\\fR pulses seen\non the MPG.  Choose \\\\fBgain\\\\fR according to the smoothing level\ndesired.  Divide the \\\\fRaxis.\\\\fIN\\\\fR.jog-scale\\\\fR values by\n\\\\fBscale\\\\fR.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "\\\\fBout\\\\fR tracks \\\\fBin\\\\fR*\\\\fBscale\\\\fR through a low-pass\nfilter of \\\\fBgain\\\\fR per period.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "A scale factor applied to the output\nvalue of the low-pass filter.",
            defaultValue: "1024",
            direction: "rw",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            doc: "Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period.",
            defaultValue: ".5",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the output based on the input and parameters.",
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
            'component ilowpass "Low-pass filter with integer inputs and outputs";\ndescription """While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the \\\\fBilowpass\\\\fR component between the MPG\nencoder \\\\fBcounts\\\\fR output and the axis \\\\fRjog-counts\\\\fR input,\nthis can be smoothed.\n\nChoose \\\\fBscale\\\\fR conservatively so that during a single session\nthere will never be more than about 2e9/\\\\fBscale\\\\fR pulses seen\non the MPG.  Choose \\\\fBgain\\\\fR according to the smoothing level\ndesired.  Divide the \\\\fRaxis.\\\\fIN\\\\fR.jog-scale\\\\fR values by\n\\\\fBscale\\\\fR.""";\n\npin in s32 in;\n\npin out s32 out """\\\\fBout\\\\fR tracks \\\\fBin\\\\fR*\\\\fBscale\\\\fR through a low-pass\nfilter of \\\\fBgain\\\\fR per period.""";\n\nparam rw float scale = 1024 """A scale factor applied to the output\nvalue of the low-pass filter.""";\n\nparam rw float gain = .5 """Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period.""";\n\nvariable double value;\n\nfunction _ "Update the output based on the input and parameters.";\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:ilowpass:ilowpass",
        name: "ilowpass",
        halComponentName: "ilowpass",
        source: "comp",
        sourcePath: "src/hal/components/ilowpass.comp",
        docs: {
          component: "Low-pass filter with integer inputs and outputs",
          description:
            "While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the *ilowpass* component between the MPG\nencoder *counts* output and the axis *jog-counts* input,\nthis can be smoothed.\n\nChoose *scale* conservatively so that during a single session\nthere will never be more than about 2e9 / *scale* pulses seen\non the MPG.  Choose *gain* according to the smoothing level\ndesired.  Divide the **axis**.__N__.**jog-scale** values by\n*scale*.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "*out* tracks *in* * *scale* through a low-pass\nfilter of *gain* per period.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "A scale factor applied to the output\nvalue of the low-pass filter.",
            defaultValue: "1024",
            direction: "rw",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            doc: "Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period.",
            defaultValue: ".5",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the output based on the input and parameters.",
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
            'component ilowpass "Low-pass filter with integer inputs and outputs";\ndescription """While it may find other applications, this component was written\nto create smoother motion while jogging with an MPG.\n\nIn a machine with high acceleration, a short jog can behave almost like a step\nfunction.  By putting the *ilowpass* component between the MPG\nencoder *counts* output and the axis *jog-counts* input,\nthis can be smoothed.\n\nChoose *scale* conservatively so that during a single session\nthere will never be more than about 2e9 / *scale* pulses seen\non the MPG.  Choose *gain* according to the smoothing level\ndesired.  Divide the **axis**.__N__.**jog-scale** values by\n*scale*.""";\n\npin in s32 in;\n\npin out s32 out """*out* tracks *in* * *scale* through a low-pass\nfilter of *gain* per period.""";\n\nparam rw float scale = 1024 """A scale factor applied to the output\nvalue of the low-pass filter.""";\n\nparam rw float gain = .5 """Together with the period, sets the rate at\nwhich the output changes.  Useful range is between 0 and 1, with higher\nvalues causing the input value to be tracked more quickly.  For\ninstance, a setting of 0.9 causes the output value to go 90% of the way\ntowards the input value in each period.""";\n\nvariable double value;\n\noption period no;\nfunction _ "Update the output based on the input and parameters.";\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
