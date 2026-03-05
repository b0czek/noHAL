import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "lowpass",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:lowpass:lowpass",
        name: "lowpass",
        halComponentName: "lowpass",
        source: "comp",
        sourcePath: "src/hal/components/lowpass.comp",
        docs: {
          component: "Low-pass filter",
          notes:
            "The effect of a specific \\fBgain\\fR value is dependent on the period of the function that \\fBlowpass.\\fIN\\fR is added to",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: " out += (in - out) * gain ",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, copy \\fBin\\fR to \\fBout\\fR instead of applying the filter equation.",
            direction: "in",
          },
        ],
        params: [
          {
            key: "gain",
            name: "gain",
            type: "float",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lowpass "Low-pass filter";\nnotes """\n\n\\\\fBgain\\\\fR pin setting\n\nThe digital filter implemented is equivalent to a unity-gain\ncontinuous-time single-pole low-pass filter that is preceded\nby a zero-order-hold and sampled at a fixed period.  For a pole\nat \\\\fB-a\\\\fR (radians/seconds) the corresponding continuous-time\nlowpass filter LaPlace transfer function is:\n\n\\\\fBH(s) = a/(s + a)\\\\fR\n\nFor a sampling period \\\\fBT\\\\fR (seconds), the gain for this\nHal lowpass component is:\n\n\\\\fBgain = 1 - e^(-a * T)\\\\fR\n\ne = 2.71828 https://en.wikipedia.org/wiki/E_(mathematical_constant)\n\n\\\\fBExamples:\\\\fR\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*100)    (\\\\fB100Hz\\\\fR bandwith single pole)\n  gain = \\\\fB0.466\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*10)     ( \\\\fB10Hz\\\\fR bandwith single pole)\n  gain = \\\\fB0.0609\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*1)      ( \\\\fB1Hz\\\\fR bandwith single pole)\n  gain = \\\\fB0.0063\\\\fR\n""";\npin in float in;\npin out float out " out += (in - out) * gain ";\npin in bit load "When TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR instead of applying the filter equation.";\nparam rw float gain;\nfunction _;\nlicense "GPL";\nnotes "The effect of a specific \\\\fBgain\\\\fR value is dependent on the period of the function that \\\\fBlowpass.\\\\fIN\\\\fR is added to";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:lowpass:lowpass",
        name: "lowpass",
        halComponentName: "lowpass",
        source: "comp",
        sourcePath: "src/hal/components/lowpass.comp",
        docs: {
          component: "Low-pass filter",
          notes:
            "The effect of a specific \\fBgain\\fR value is dependent on the period of the function that \\fBlowpass.\\fIN\\fR is added to",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: " out += (in - out) * gain ",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, copy \\fBin\\fR to \\fBout\\fR instead of applying the filter equation.",
            direction: "in",
          },
        ],
        params: [
          {
            key: "gain",
            name: "gain",
            type: "float",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lowpass "Low-pass filter";\nnotes """\n\n\\\\fBgain\\\\fR pin setting\n\nThe digital filter implemented is equivalent to a unity-gain\ncontinuous-time single-pole low-pass filter that is preceded\nby a zero-order-hold and sampled at a fixed period.  For a pole\nat \\\\fB-a\\\\fR (radians/seconds) the corresponding continuous-time\nlowpass filter LaPlace transfer function is:\n\n\\\\fBH(s) = a/(s + a)\\\\fR\n\nFor a sampling period \\\\fBT\\\\fR (seconds), the gain for this\nHal lowpass component is:\n\n\\\\fBgain = 1 - e^(-a * T)\\\\fR\n\ne = 2.71828 https://en.wikipedia.org/wiki/E_(mathematical_constant)\n\n\\\\fBExamples:\\\\fR\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*100)    (\\\\fB100Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.466\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*10)     ( \\\\fB10Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.0609\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*1)      ( \\\\fB1Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.0063\\\\fR\n""";\npin in float in;\npin out float out " out += (in - out) * gain ";\npin in bit load "When TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR instead of applying the filter equation.";\nparam rw float gain;\nfunction _;\nlicense "GPL";\nnotes "The effect of a specific \\\\fBgain\\\\fR value is dependent on the period of the function that \\\\fBlowpass.\\\\fIN\\\\fR is added to";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:lowpass:lowpass",
        name: "lowpass",
        halComponentName: "lowpass",
        source: "comp",
        sourcePath: "src/hal/components/lowpass.comp",
        docs: {
          component: "Low-pass filter",
          notes:
            "The effect of a specific \\fBgain\\fR value is dependent on the period of the function that \\fBlowpass.\\fIN\\fR is added to.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: " out += (in - out) * gain ",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, copy \\fBin\\fR to \\fBout\\fR instead of applying the filter equation.",
            direction: "in",
          },
        ],
        params: [
          {
            key: "gain",
            name: "gain",
            type: "float",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lowpass "Low-pass filter";\nnotes """\n\n\\\\fBgain\\\\fR pin setting\n\nThe digital filter implemented is equivalent to a unity-gain\ncontinuous-time single-pole low-pass filter that is preceded\nby a zero-order-hold and sampled at a fixed period.  For a pole\nat \\\\fB-a\\\\fR (radians/seconds) the corresponding continuous-time\nlowpass filter LaPlace transfer function is:\n\n\\\\fBH(s) = a/(s + a)\\\\fR\n\nFor a sampling period \\\\fBT\\\\fR (seconds), the gain for this\nHal lowpass component is:\n\n\\\\fBgain = 1 - e^(-a * T)\\\\fR\n\ne = 2.71828 https://en.wikipedia.org/wiki/E_(mathematical_constant)\n\n\\\\fBExamples:\\\\fR\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*100)    (\\\\fB100Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.466\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*10)     ( \\\\fB10Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.0609\\\\fR\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2*pi*1)      ( \\\\fB1Hz\\\\fR bandwidth single pole)\n  gain = \\\\fB0.0063\\\\fR\n""";\npin in float in;\npin out float out " out += (in - out) * gain ";\npin in bit load "When TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR instead of applying the filter equation.";\nparam rw float gain;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\nnotes "The effect of a specific \\\\fBgain\\\\fR value is dependent on the period of the function that \\\\fBlowpass.\\\\fIN\\\\fR is added to.";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:lowpass:lowpass",
        name: "lowpass",
        halComponentName: "lowpass",
        source: "comp",
        sourcePath: "src/hal/components/lowpass.comp",
        docs: {
          component: "Low-pass filter",
          notes:
            "The effect of a specific *gain* value is dependent on the period of the function that *lowpass.N* is added to.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: " out += (in - out) * gain ",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, copy *in* to *out* instead of applying the filter equation.",
            direction: "in",
          },
        ],
        params: [
          {
            key: "gain",
            name: "gain",
            type: "float",
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
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lowpass "Low-pass filter";\nnotes """\n\n*gain* pin setting\n\nThe digital filter implemented is equivalent to a unity-gain\ncontinuous-time single-pole low-pass filter that is preceded\nby a zero-order-hold and sampled at a fixed period.  For a pole\nat *-a* (radians/seconds) the corresponding continuous-time\nlowpass filter LaPlace transfer function is:\n\nH(s) = a/(s + a)\n\nFor a sampling period *T* (seconds), the gain for this HAL lowpass component is:\n\ngain = 1 - e^(-a * T)\n\ne = 2.71828 https://en.wikipedia.org/wiki/E_(mathematical_constant)\n\nExamples:\n     T = 0.001 seconds (typical servo thread period)\n     a = (2 * pi * 100)    (*100Hz* bandwidth single pole)\n  gain = *0.466*\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2 * pi * 10)     ( *10Hz* bandwidth single pole)\n  gain = *0.0609*\n\n     T = 0.001 seconds (typical servo thread period)\n     a = (2 * pi * 1)      ( *1Hz* bandwidth single pole)\n  gain = *0.0063*\n""";\npin in float in;\npin out float out " out += (in - out) * gain ";\npin in bit load "When TRUE, copy *in* to *out* instead of applying the filter equation.";\nparam rw float gain;\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\nnotes "The effect of a specific *gain* value is dependent on the period of the function that *lowpass.N* is added to.";\n',
        },
      },
    },
  ],
};

export default history;
