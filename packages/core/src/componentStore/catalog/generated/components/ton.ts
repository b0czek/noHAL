import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "ton",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:ton:ton",
        name: "ton",
        halComponentName: "ton",
        source: "comp",
        sourcePath: "src/hal/components/ton.comp",
        docs: {
          component: "IEC TON timer - delay rising edge on a signal",
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
            doc: "Elapsed time since rising edge in seconds",
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
            '/********************************************************************\n* Description: ton.comp\n*   IEC_61131-3 Time On timer for LinuxCNC HAL bit signals.\n*\n*   This is a HAL component that can be used to delay rising edge signals\n*   for a certain amount of time.\n*\n*********************************************************************\n*\n* Author: Chad Woitas (aka satiowadahc)\n* License: GPL Version 2\n* Created on: 2021/06/10\n* System: Linux\n*\n* Copyright (c) 2021 All rights reserved.\n*\n* Last change: 2021-11-02 - Conversion to comp format\n*\n********************************************************************/\ncomponent ton "IEC TON timer - delay rising edge on a signal";\npin in bit in "Input signal";\npin out bit q "Output signal";\npin out float et "Elapsed time since rising edge in seconds";\n\nparam rw float pt "Delay time in seconds";\n\nfunction _ fp "Update the timer";\nlicense "GPL";\nauthor "Chad Woitas";\n',
        },
      },
    },
  ],
};

export default history;
