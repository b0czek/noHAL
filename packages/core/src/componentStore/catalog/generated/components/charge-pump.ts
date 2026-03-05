import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "charge_pump",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:charge-pump:charge-pump",
        name: "charge_pump",
        halComponentName: "charge_pump",
        source: "comp",
        sourcePath: "src/hal/components/charge_pump.comp",
        docs: {
          component:
            "Create a square-wave for the 'charge pump' input of some controller boards",
          description:
            "\nThe 'Charge Pump' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 hz or 5 Khz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Square wave if 'enable' is TRUE or unconnected, low if 'enable' is FALSE",
            direction: "out",
          },
          {
            key: "out_2",
            name: "out-2",
            type: "bit",
            doc: "Square wave at half the frequency of 'out'",
            direction: "out",
          },
          {
            key: "out_4",
            name: "out-4",
            type: "bit",
            doc: "Square wave at a quarter of the frequency of 'out'",
            direction: "out",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, forces all 'out' pins to be low",
            defaultValue: "TRUE",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Toggle the output bit (if enabled)",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            singleton: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'charge-pump\' component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent charge_pump "Create a square-wave for the \'charge pump\' input of some controller boards";\noption singleton yes;\npin out bit out "Square wave if \'enable\' is TRUE or unconnected, low if \'enable\' is FALSE";\npin out bit out-2 "Square wave at half the frequency of \'out\'";\npin out bit out-4 "Square wave at a quarter of the frequency of \'out\'";\npin in bit enable = TRUE "If FALSE, forces all \'out\' pins to be low";\nfunction _ nofp "Toggle the output bit (if enabled)";\ndescription """\nThe \'Charge Pump\' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 hz or 5 Khz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.""";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:charge-pump:charge-pump",
        name: "charge_pump",
        halComponentName: "charge_pump",
        source: "comp",
        sourcePath: "src/hal/components/charge_pump.comp",
        docs: {
          component:
            "Create a square-wave for the 'charge pump' input of some controller boards",
          description:
            "\nThe 'Charge Pump' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 hz or 5 Khz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Square wave if 'enable' is TRUE or unconnected, low if 'enable' is FALSE",
            direction: "out",
          },
          {
            key: "out_2",
            name: "out-2",
            type: "bit",
            doc: "Square wave at half the frequency of 'out'",
            direction: "out",
          },
          {
            key: "out_4",
            name: "out-4",
            type: "bit",
            doc: "Square wave at a quarter of the frequency of 'out'",
            direction: "out",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, forces all 'out' pins to be low",
            defaultValue: "TRUE",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Toggle the output bit (if enabled)",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            singleton: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'charge-pump\' component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent charge_pump "Create a square-wave for the \'charge pump\' input of some controller boards";\noption singleton yes;\npin out bit out "Square wave if \'enable\' is TRUE or unconnected, low if \'enable\' is FALSE";\npin out bit out-2 "Square wave at half the frequency of \'out\'";\npin out bit out-4 "Square wave at a quarter of the frequency of \'out\'";\npin in bit enable = TRUE "If FALSE, forces all \'out\' pins to be low";\nfunction _ nofp "Toggle the output bit (if enabled)";\ndescription """\nThe \'Charge Pump\' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 hz or 5 Khz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.""";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:charge-pump:charge-pump",
        name: "charge_pump",
        halComponentName: "charge_pump",
        source: "comp",
        sourcePath: "src/hal/components/charge_pump.comp",
        docs: {
          component:
            "Create a square-wave for the 'charge pump' input of some controller boards",
          description:
            "\nThe 'Charge Pump' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = Hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 Hz or 5 kHz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Square wave if 'enable' is TRUE or unconnected, low if 'enable' is FALSE",
            direction: "out",
          },
          {
            key: "out_2",
            name: "out-2",
            type: "bit",
            doc: "Square wave at half the frequency of 'out'",
            direction: "out",
          },
          {
            key: "out_4",
            name: "out-4",
            type: "bit",
            doc: "Square wave at a quarter of the frequency of 'out'",
            direction: "out",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, forces all 'out' pins to be low",
            defaultValue: "TRUE",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Toggle the output bit (if enabled)",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            singleton: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'charge-pump\' component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent charge_pump "Create a square-wave for the \'charge pump\' input of some controller boards";\noption singleton yes;\npin out bit out "Square wave if \'enable\' is TRUE or unconnected, low if \'enable\' is FALSE";\npin out bit out-2 "Square wave at half the frequency of \'out\'";\npin out bit out-4 "Square wave at a quarter of the frequency of \'out\'";\npin in bit enable = TRUE "If FALSE, forces all \'out\' pins to be low";\nfunction _ nofp "Toggle the output bit (if enabled)";\ndescription """\nThe \'Charge Pump\' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = Hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 Hz or 5 kHz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:charge-pump:charge-pump",
        name: "charge_pump",
        halComponentName: "charge_pump",
        source: "comp",
        sourcePath: "src/hal/components/charge_pump.comp",
        docs: {
          component:
            "Create a square-wave for the 'charge pump' input of some controller boards",
          description:
            "\nThe 'Charge Pump' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = Hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 Hz or 5 kHz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Square wave if 'enable' is TRUE or unconnected, low if 'enable' is FALSE",
            direction: "out",
          },
          {
            key: "out_2",
            name: "out-2",
            type: "bit",
            doc: "Square wave at half the frequency of 'out'",
            direction: "out",
          },
          {
            key: "out_4",
            name: "out-4",
            type: "bit",
            doc: "Square wave at a quarter of the frequency of 'out'",
            direction: "out",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, forces all 'out' pins to be low",
            defaultValue: "TRUE",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Toggle the output bit (if enabled)",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            singleton: true,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'charge-pump\' component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent charge_pump "Create a square-wave for the \'charge pump\' input of some controller boards";\noption singleton yes;\npin out bit out "Square wave if \'enable\' is TRUE or unconnected, low if \'enable\' is FALSE";\npin out bit out-2 "Square wave at half the frequency of \'out\'";\npin out bit out-4 "Square wave at a quarter of the frequency of \'out\'";\npin in bit enable = TRUE "If FALSE, forces all \'out\' pins to be low";\nfunction _ nofp "Toggle the output bit (if enabled)";\ndescription """\nThe \'Charge Pump\' should be added to the base thread function.\nWhen enabled the output is on for one period and off for one period. To calculate the\nfrequency of the output 1/(period time in seconds x 2) = Hz. For example if you\nhave a base period of 100,000ns that is 0.0001 seconds and the formula would be\n1/(0.0001 x 2) = 5,000 Hz or 5 kHz. Two additional outputs are provided that run\na factor of 2 and 4 slower for hardware that requires a lower frequency.""";\nlicense "GPL";\noption period no;\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
