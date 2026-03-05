import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "safety_latch",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:safety-latch:safety-latch",
        name: "safety_latch",
        halComponentName: "safety_latch",
        source: "comp",
        sourcePath: "src/hal/components/safety_latch.comp",
        docs: {
          component: "latch for error signals",
          description:
            "\nHAL component that implements a safety latch for error signals\nwith customizable harm, healing and latching features.\n\nWhen the component is not enabled the error input value is\nforwarded to output without further modififactions.\n\nIf error-in is true the error count is increased by harm.\nIf error-in is false the error count is decreased by heal.\nWhen the error count exceeds the threscold value error-out is\nset to true. If latching is false the error-out pin will only\nreturn to false when reset is set to true.\n\nThe inputs pin min and max clamp the error count value to a\nspecified range.\n",
          license: "GPL",
          author: "Alexander Rössler",
        },
        pins: [
          {
            key: "error_in",
            name: "error-in",
            type: "bit",
            doc: "Error Input",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "heal",
            name: "heal",
            type: "s32",
            doc: "Heal when ok per tick",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "harm",
            name: "harm",
            type: "s32",
            doc: "Harm when error per tick",
            defaultValue: "1",
            direction: "in",
          },
          {
            key: "latching",
            name: "latching",
            type: "bit",
            doc: "If a reset is necessary to heal an error",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset input",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "s32",
            doc: "Error output threshold",
            defaultValue: "100",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            doc: "Minimum count",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            doc: "Maximum count",
            defaultValue: "1000",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If not enabled the error count is passed to the output",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "count",
            name: "count",
            type: "s32",
            doc: "Current count",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "error_out",
            name: "error-out",
            type: "bit",
            doc: "Error output",
            defaultValue: "false",
            direction: "out",
          },
          {
            key: "ok_out",
            name: "ok-out",
            type: "bit",
            doc: "Ok output",
            defaultValue: "true",
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
            '/******************************************************************************\n *\n * Copyright (C) 2015 Alexander Rössler\n *\n *\n * Safety latch for error signals\n *\n ******************************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of the GNU General Public License\n * as published by the Free Software Foundation; either version 2\n * of the License, or (at your option) any later version.\n *\n * This program is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with this program; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA\n * 02110-1301, USA.\n *\n * THE AUTHORS OF THIS PROGRAM ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code is part of the Machinekit HAL project.  For more\n * information, go to https://github.com/machinekit.\n *\n ******************************************************************************/\ncomponent safety_latch "latch for error signals";\ndescription """\nHAL component that implements a safety latch for error signals\nwith customizable harm, healing and latching features.\n\nWhen the component is not enabled the error input value is\nforwarded to output without further modififactions.\n\nIf error-in is true the error count is increased by harm.\nIf error-in is false the error count is decreased by heal.\nWhen the error count exceeds the threscold value error-out is\nset to true. If latching is false the error-out pin will only\nreturn to false when reset is set to true.\n\nThe inputs pin min and max clamp the error count value to a\nspecified range.\n""";\npin in bit error_in = false "Error Input";\npin in s32 heal = 1 "Heal when ok per tick";\npin in s32 harm = 1 "Harm when error per tick";\npin in bit latching = true "If a reset is necessary to heal an error";\npin in bit reset = false "Reset input";\npin in s32 threshold = 100 "Error output threshold";\npin in s32 min = 0 "Minimum count";\npin in s32 max = 1000 "Maximum count";\npin in bit enable = true "If not enabled the error count is passed to the output";\npin out s32 count = 0 "Current count";\npin out bit error_out = false "Error output";\npin out bit ok_out = true "Ok output";\n\nvariable hal_bit_t last_reset = false;\n\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "Alexander Rössler";\n',
        },
      },
    },
  ],
};

export default history;
