import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "tp",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:tp:tp",
        name: "tp",
        halComponentName: "tp",
        source: "comp",
        sourcePath: "src/hal/components/tp.comp",
        docs: {
          component:
            "IEC TP timer - generate a high pulse of defined duration on rising edge",
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
            doc: "Elapsed time since start of pulse in seconds",
            direction: "out",
          },
        ],
        params: [
          {
            key: "pt",
            name: "pt",
            type: "float",
            doc: "Pulse time in seconds",
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
            '/********************************************************************\n* Description: tp.comp\n*   IEC_61131-3 Pulse Time timer for LinuxCNC HAL bit signals.\n*\n*   This is a HAL component that can be used to send a pulse signal\n*   for a certain amount of time.\n*\n*********************************************************************\n*\n* Author: Chad Woitas (aka satiowadahc)\n* License: GPL Version 2\n* Created on: 2021/06/10\n* System: Linux\n*\n* Copyright (c) 2021 All rights reserved.\n*\n* Last change: 2021-11-02 - Conversion to comp format\n*\n********************************************************************/\ncomponent tp "IEC TP timer - generate a high pulse of defined duration on rising edge";\npin in bit in "Input signal";\npin out bit q "Output signal";\npin out float et "Elapsed time since start of pulse in seconds";\n\nparam rw float pt "Pulse time in seconds";\n\nvariable int in_old; // Value of in on last cycle, for rising edge detection\n\nfunction _ fp "Update the timer";\nlicense "GPL";\nauthor "Chad Woitas";\n',
        },
      },
    },
  ],
};

export default history;
