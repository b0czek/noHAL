import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "blend",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:blend:blend",
        name: "blend",
        halComponentName: "blend",
        source: "comp",
        sourcePath: "src/hal/components/blend.comp",
        docs: {
          component: "Perform linear interpolation between two values",
          license: "GPL",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "First input.  If select is equal to 1.0, the output is equal to in1",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            doc: "Second input.  If select is equal to 0.0, the output is equal to in2",
            direction: "in",
          },
          {
            key: "select",
            name: "select",
            type: "float",
            doc: "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "open",
            name: "open",
            type: "bit",
            doc: "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent blend "Perform linear interpolation between two values";\n\npin in float in1 "First input.  If select is equal to 1.0, the output is equal to in1";\npin in float in2 "Second input.  If select is equal to 0.0, the output is equal to in2";\npin in float select "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1";\npin out float out "Output value.";\n\nparam rw bit open "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1";\n\nfunction _;\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:blend:blend",
        name: "blend",
        halComponentName: "blend",
        source: "comp",
        sourcePath: "src/hal/components/blend.comp",
        docs: {
          component: "Perform linear interpolation between two values",
          license: "GPL",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "First input.  If select is equal to 1.0, the output is equal to in1",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            doc: "Second input.  If select is equal to 0.0, the output is equal to in2",
            direction: "in",
          },
          {
            key: "select",
            name: "select",
            type: "float",
            doc: "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "open",
            name: "open",
            type: "bit",
            doc: "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent blend "Perform linear interpolation between two values";\n\npin in float in1 "First input.  If select is equal to 1.0, the output is equal to in1";\npin in float in2 "Second input.  If select is equal to 0.0, the output is equal to in2";\npin in float select "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1";\npin out float out "Output value.";\n\nparam rw bit open "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1";\n\nfunction _;\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:blend:blend",
        name: "blend",
        halComponentName: "blend",
        source: "comp",
        sourcePath: "src/hal/components/blend.comp",
        docs: {
          component: "Perform linear interpolation between two values",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "First input.  If select is equal to 1.0, the output is equal to in1",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            doc: "Second input.  If select is equal to 0.0, the output is equal to in2",
            direction: "in",
          },
          {
            key: "select",
            name: "select",
            type: "float",
            doc: "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "open",
            name: "open",
            type: "bit",
            doc: "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent blend "Perform linear interpolation between two values";\n\npin in float in1 "First input.  If select is equal to 1.0, the output is equal to in1";\npin in float in2 "Second input.  If select is equal to 0.0, the output is equal to in2";\npin in float select "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1";\npin out float out "Output value.";\n\nparam rw bit open "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1";\n\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:blend:blend",
        name: "blend",
        halComponentName: "blend",
        source: "comp",
        sourcePath: "src/hal/components/blend.comp",
        docs: {
          component: "Perform linear interpolation between two values",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "First input.  If select is equal to 1.0, the output is equal to in1",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            doc: "Second input.  If select is equal to 0.0, the output is equal to in2",
            direction: "in",
          },
          {
            key: "select",
            name: "select",
            type: "float",
            doc: "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "open",
            name: "open",
            type: "bit",
            doc: "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent blend "Perform linear interpolation between two values";\n\npin in float in1 "First input.  If select is equal to 1.0, the output is equal to in1";\npin in float in2 "Second input.  If select is equal to 0.0, the output is equal to in2";\npin in float select "Select input.  For values between 0.0 and 1.0, the output changes linearly from in2 to in1";\npin out float out "Output value.";\n\nparam rw bit open "If true, select values outside the range 0.0 to 1.0 give values outside the range in2 to in1.  If false, outputs are clamped to the the range in2 to in1";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
