import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "led_dim",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:led-dim:led-dim",
        name: "led_dim",
        halComponentName: "led_dim",
        source: "comp",
        sourcePath: "src/hal/components/led_dim.comp",
        docs: {
          component: "HAL component for dimming LEDs",
          description:
            "\nComponent for LED dimming according to human perception of brightness of light.\n.LP\nThe output is calculated using the CIE 1931 formula.\n",
          license: "GPL",
          author: "Alexander Rössler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Brightness input value -> 0 to 1",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Luminance output value -> 0 to 1",
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
            '/******************************************************************************\n *\n * Copyright (C) 2015 Alexander Rössler\n *\n *\n * This module allows dimming LEDs using HAL\n *\n ******************************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of the GNU General Public License\n * as published by the Free Software Foundation; either version 2\n * of the License, or (at your option) any later version.\n *\n * This program is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with this program; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA\n * 02110-1301, USA.\n *\n * THE AUTHORS OF THIS PROGRAM ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code is part of the Machinekit HAL project.  For more\n * information, go to https://github.com/machinekit.\n *\n ******************************************************************************/\ncomponent led_dim "HAL component for dimming LEDs";\npin in  float in "Brightness input value -> 0 to 1";\npin out float out "Luminance output value -> 0 to 1";\nfunction _  fp "Update the output value";\ndescription """\nComponent for LED dimming according to human perception of brightness of light.\n.LP\nThe output is calculated using the CIE 1931 formula.\n""";\nlicense "GPL";\nauthor "Alexander Rössler";\noption period no;\nvariable hal_float_t last_in = 0.0;\n',
        },
      },
    },
  ],
};

export default history;
