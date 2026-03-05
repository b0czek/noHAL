import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "reset",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:reset:reset",
        name: "reset",
        halComponentName: "reset",
        source: "comp",
        sourcePath: "src/hal/components/reset.comp",
        docs: {
          component: "Resets an IO signal",
          description:
            "\nComponent to reset IO signals.\n\nThis function works like a conditional sets - it is fed with a float\nand/or bit/s32/u32 pins that are I/O, but are save the value only if\nthe *trigger* pin is set. The values assigned to those signals are\npassed via the input pins reset_float/s32/u32/bit.\n",
          license: "GPL",
          author: "Alexander Rössler",
        },
        pins: [
          {
            key: "trigger",
            name: "trigger",
            type: "bit",
            doc: "Trigger input",
            direction: "in",
          },
          {
            key: "out_u32",
            name: "out-u32",
            type: "u32",
            doc: "Unsigned 32 bit integer output value",
            defaultValue: "0",
            direction: "io",
          },
          {
            key: "reset_u32",
            name: "reset-u32",
            type: "u32",
            doc: "Unsigned 32 bit integer reset value",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "out_s32",
            name: "out-s32",
            type: "s32",
            doc: "Signed 32 bit integer output value",
            defaultValue: "0",
            direction: "io",
          },
          {
            key: "reset_s32",
            name: "reset-s32",
            type: "s32",
            doc: "Signed 32 bit integer reset value",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "out_float",
            name: "out-float",
            type: "float",
            doc: "Float output value",
            defaultValue: "0.0",
            direction: "io",
          },
          {
            key: "reset_float",
            name: "reset-float",
            type: "float",
            doc: "Float reset value",
            defaultValue: "0.0",
            direction: "in",
          },
          {
            key: "out_bit",
            name: "out-bit",
            type: "bit",
            doc: "Bit integer output value",
            defaultValue: "false",
            direction: "io",
          },
          {
            key: "reset_bit",
            name: "reset-bit",
            type: "bit",
            doc: "Bit reset value",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "retriggerable",
            name: "retriggerable",
            type: "bit",
            doc: "Allow additional edges to reset",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "rising",
            name: "rising",
            type: "bit",
            doc: "Trigger on rising edge",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "falling",
            name: "falling",
            type: "bit",
            doc: "Trigger on falling edge",
            defaultValue: "false",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update the output value",
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
            '/******************************************************************************\n *\n * Copyright (C) 2015 Alexander Rössler\n *\n *\n * This module resets a IO signal\n *\n ******************************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of the GNU General Public License\n * as published by the Free Software Foundation; either version 2\n * of the License, or (at your option) any later version.\n *\n * This program is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with this program; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA\n * 02110-1301, USA.\n *\n * THE AUTHORS OF THIS PROGRAM ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code is part of the Machinekit HAL project.  For more\n * information, go to https://github.com/machinekit.\n *\n ******************************************************************************/\n\ncomponent reset "Resets an IO signal";\npin in  bit     trigger             "Trigger input";\npin io  u32     out_u32      = 0    "Unsigned 32 bit integer output value";\npin in  u32     reset_u32    = 0    "Unsigned 32 bit integer reset value";\npin io  s32     out_s32      = 0    "Signed 32 bit integer output value";\npin in  s32     reset_s32    = 0    "Signed 32 bit integer reset value";\npin io  float   out_float    = 0.0  "Float output value";\npin in  float   reset_float  = 0.0  "Float reset value";\npin io  bit     out_bit      = false  "Bit integer output value";\npin in  bit     reset_bit    = false  "Bit reset value";\npin in  bit     retriggerable = true  "Allow additional edges to reset";\npin in  bit     rising        = true  "Trigger on rising edge";\npin in  bit     falling       = false "Trigger on falling edge";\noption period no;\nfunction _  fp "Update the output value";\ndescription """\nComponent to reset IO signals.\n\nThis function works like a conditional sets - it is fed with a float\nand/or bit/s32/u32 pins that are I/O, but are save the value only if\nthe *trigger* pin is set. The values assigned to those signals are\npassed via the input pins reset_float/s32/u32/bit.\n""";\nlicense "GPL";\nauthor "Alexander Rössler";\nvariable hal_bit_t last_trigger = false;\n',
        },
      },
    },
  ],
};

export default history;
