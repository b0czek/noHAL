import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "tof",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:tof:tof",
        name: "tof",
        halComponentName: "tof",
        source: "comp",
        sourcePath: "src/hal/components/tof.comp",
        docs: {
          component: "IEC TOF timer - delay falling edge on a signal",
          license: "GPL",
          author: "Chad Woitas",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Input signal",
            direction: "in",
          },
          {
            key: "q",
            name: "q",
            type: "bit",
            doc: "Output signal",
            direction: "out",
          },
          {
            key: "et",
            name: "et",
            type: "float",
            doc: "Elapsed time since falling edge in seconds",
            direction: "out",
          },
        ],
        params: [
          {
            key: "pt",
            name: "pt",
            type: "float",
            doc: "Delay time in seconds",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the timer",
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
            '/********************************************************************\n* Description: tof.comp\n*   IEC_61131-3 Time Off timer for HAL bit signals.\n*\n*   This is a HAL component that can be used to delay falling edge signals\n*   for a certain amount of time.\n*\n*********************************************************************\n*\n* Author: Chad Woitas (aka satiowadahc)\n* License: GPL Version 2\n* Created on: 2021/06/10\n* System: Linux\n*\n* Copyright (c) 2021 All rights reserved.\n*\n* Last change: 2021-11-02 - Conversion to comp format\n*\n********************************************************************/\ncomponent tof "IEC TOF timer - delay falling edge on a signal";\npin in bit in "Input signal";\npin out bit q "Output signal";\npin out float et "Elapsed time since falling edge in seconds";\n\nparam rw float pt "Delay time in seconds";\n\nfunction _ fp "Update the timer";\nlicense "GPL";\nauthor "Chad Woitas";\n',
        },
      },
    },
  ],
};

export default history;
