import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "differential",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:differential:differential",
        name: "differential",
        halComponentName: "differential",
        source: "comp",
        sourcePath: "src/hal/components/differential.comp",
        docs: {
          component: "kinematics for a differential transmission",
          license: "GPL",
        },
        pins: [
          {
            key: "roll_cmd",
            name: "roll-cmd",
            type: "float",
            doc: "position command for roll (in degrees)",
            direction: "in",
          },
          {
            key: "pitch_cmd",
            name: "pitch-cmd",
            type: "float",
            doc: "position command for pitch (in degrees)",
            direction: "in",
          },
          {
            key: "roll_fb",
            name: "roll-fb",
            type: "float",
            doc: "position feedback for roll (in degrees)",
            direction: "out",
          },
          {
            key: "pitch_fb",
            name: "pitch-fb",
            type: "float",
            doc: "position feedback for pitch (in degrees)",
            direction: "out",
          },
          {
            key: "motor0_cmd",
            name: "motor0-cmd",
            type: "float",
            doc: "position command to motor0 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor1_cmd",
            name: "motor1-cmd",
            type: "float",
            doc: "position command to motor1 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor0_fb",
            name: "motor0-fb",
            type: "float",
            doc: "position feedback from motor0",
            direction: "in",
          },
          {
            key: "motor1_fb",
            name: "motor1-fb",
            type: "float",
            doc: "position feedback from motor1",
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
            '// This is a simple differential "kinematics" component for LinuxCNC HAL.\n// Copyright 2015-2016 Sebastian Kuzminsky <seb@highlab.com>\n//\n// This program is free software; you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation; either version 2 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program; if not, write to the Free Software\n// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent differential "kinematics for a differential transmission";\n\npin in float roll-cmd  "position command for roll (in degrees)";\npin in float pitch-cmd "position command for pitch (in degrees)";\n\npin out float roll-fb  "position feedback for roll (in degrees)";\npin out float pitch-fb "position feedback for pitch (in degrees)";\n\npin out float motor0-cmd "position command to motor0 (based on roll & pitch inputs)";\npin out float motor1-cmd "position command to motor1 (based on roll & pitch inputs)";\n\npin in float motor0-fb "position feedback from motor0";\npin in float motor1-fb "position feedback from motor1";\n\nfunction _;\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:differential:differential",
        name: "differential",
        halComponentName: "differential",
        source: "comp",
        sourcePath: "src/hal/components/differential.comp",
        docs: {
          component: "kinematics for a differential transmission",
          license: "GPL",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "roll_cmd",
            name: "roll-cmd",
            type: "float",
            doc: "position command for roll (in degrees)",
            direction: "in",
          },
          {
            key: "pitch_cmd",
            name: "pitch-cmd",
            type: "float",
            doc: "position command for pitch (in degrees)",
            direction: "in",
          },
          {
            key: "roll_fb",
            name: "roll-fb",
            type: "float",
            doc: "position feedback for roll (in degrees)",
            direction: "out",
          },
          {
            key: "pitch_fb",
            name: "pitch-fb",
            type: "float",
            doc: "position feedback for pitch (in degrees)",
            direction: "out",
          },
          {
            key: "motor0_cmd",
            name: "motor0-cmd",
            type: "float",
            doc: "position command to motor0 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor1_cmd",
            name: "motor1-cmd",
            type: "float",
            doc: "position command to motor1 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor0_fb",
            name: "motor0-fb",
            type: "float",
            doc: "position feedback from motor0",
            direction: "in",
          },
          {
            key: "motor1_fb",
            name: "motor1-fb",
            type: "float",
            doc: "position feedback from motor1",
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
            '// This is a simple differential "kinematics" component for LinuxCNC HAL.\n// Copyright 2015-2016 Sebastian Kuzminsky <seb@highlab.com>\n//\n// This program is free software; you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation; either version 2 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program; if not, write to the Free Software\n// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent differential "kinematics for a differential transmission";\n\npin in float roll-cmd  "position command for roll (in degrees)";\npin in float pitch-cmd "position command for pitch (in degrees)";\n\npin out float roll-fb  "position feedback for roll (in degrees)";\npin out float pitch-fb "position feedback for pitch (in degrees)";\n\npin out float motor0-cmd "position command to motor0 (based on roll & pitch inputs)";\npin out float motor1-cmd "position command to motor1 (based on roll & pitch inputs)";\n\npin in float motor0-fb "position feedback from motor0";\npin in float motor1-fb "position feedback from motor1";\n\nfunction _;\nlicense "GPL";\nauthor "Sebastian Kuzminsky";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:differential:differential",
        name: "differential",
        halComponentName: "differential",
        source: "comp",
        sourcePath: "src/hal/components/differential.comp",
        docs: {
          component: "kinematics for a differential transmission",
          license: "GPL",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "roll_cmd",
            name: "roll-cmd",
            type: "float",
            doc: "position command for roll (in degrees)",
            direction: "in",
          },
          {
            key: "pitch_cmd",
            name: "pitch-cmd",
            type: "float",
            doc: "position command for pitch (in degrees)",
            direction: "in",
          },
          {
            key: "roll_fb",
            name: "roll-fb",
            type: "float",
            doc: "position feedback for roll (in degrees)",
            direction: "out",
          },
          {
            key: "pitch_fb",
            name: "pitch-fb",
            type: "float",
            doc: "position feedback for pitch (in degrees)",
            direction: "out",
          },
          {
            key: "motor0_cmd",
            name: "motor0-cmd",
            type: "float",
            doc: "position command to motor0 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor1_cmd",
            name: "motor1-cmd",
            type: "float",
            doc: "position command to motor1 (based on roll & pitch inputs)",
            direction: "out",
          },
          {
            key: "motor0_fb",
            name: "motor0-fb",
            type: "float",
            doc: "position feedback from motor0",
            direction: "in",
          },
          {
            key: "motor1_fb",
            name: "motor1-fb",
            type: "float",
            doc: "position feedback from motor1",
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
            '// This is a simple differential "kinematics" component for LinuxCNC HAL.\n// Copyright 2015-2016 Sebastian Kuzminsky <seb@highlab.com>\n//\n// This program is free software; you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation; either version 2 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program; if not, write to the Free Software\n// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent differential "kinematics for a differential transmission";\n\npin in float roll-cmd  "position command for roll (in degrees)";\npin in float pitch-cmd "position command for pitch (in degrees)";\n\npin out float roll-fb  "position feedback for roll (in degrees)";\npin out float pitch-fb "position feedback for pitch (in degrees)";\n\npin out float motor0-cmd "position command to motor0 (based on roll & pitch inputs)";\npin out float motor1-cmd "position command to motor1 (based on roll & pitch inputs)";\n\npin in float motor0-fb "position feedback from motor0";\npin in float motor1-fb "position feedback from motor1";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Sebastian Kuzminsky";\n\n',
        },
      },
    },
  ],
};

export default history;
