import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "ddt",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:ddt:ddt",
        name: "ddt",
        halComponentName: "ddt",
        source: "comp",
        sourcePath: "src/hal/components/ddt.comp",
        docs: {
          component: "Compute the derivative of the input function",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent ddt "Compute the derivative of the input function";\n\npin in float in;\npin out float out;\n\nvariable double old;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:ddt:ddt",
        name: "ddt",
        halComponentName: "ddt",
        source: "comp",
        sourcePath: "src/hal/components/ddt.comp",
        docs: {
          component: "Compute the derivative of the input function",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent ddt "Compute the derivative of the input function";\n\npin in float in;\npin out float out;\n\nvariable double old;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:ddt:ddt",
        name: "ddt",
        halComponentName: "ddt",
        source: "comp",
        sourcePath: "src/hal/components/ddt.comp",
        docs: {
          component: "Compute the derivative of the input function",
          author: "Jeff Epler",
          description:
            "\nFor every function call from the real time thread, calculate the\ndifference between the old and current input value divided by the\ntimer elapsed since the last call.\n",
          notes:
            "\n\nAs this only work on two consecutive input values, it will only work\nwell if the input change every function call, and not work so well if\nthe rate of change is very low and the input change do not happen\nevery time the real time function is called.\n\n",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent ddt "Compute the derivative of the input function";\nauthor "Jeff Epler";\n\ndescription """\nFor every function call from the real time thread, calculate the\ndifference between the old and current input value divided by the\ntimer elapsed since the last call.\n""";\n\nnotes """\n\nAs this only work on two consecutive input values, it will only work\nwell if the input change every function call, and not work so well if\nthe rate of change is very low and the input change do not happen\nevery time the real time function is called.\n\n""";\n\n\npin in float in;\npin out float out;\n\nvariable double old;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
  ],
};

export default history;
