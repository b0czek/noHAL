import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "maj3",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:maj3:maj3",
        name: "maj3",
        halComponentName: "maj3",
        source: "comp",
        sourcePath: "src/hal/components/maj3.comp",
        docs: {
          component: "Compute the majority of 3 inputs",
          license: "GPL",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "invert",
            name: "invert",
            type: "bit",
            direction: "rw",
          },
        ],
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'majority-of-3\' component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent maj3 "Compute the majority of 3 inputs";\n\npin in bit in1;\npin in bit in2;\npin in bit in3;\npin out bit out;\n\nparam rw bit invert;\n\nfunction _ nofp;\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:maj3:maj3",
        name: "maj3",
        halComponentName: "maj3",
        source: "comp",
        sourcePath: "src/hal/components/maj3.comp",
        docs: {
          component: "Compute the majority of 3 inputs",
          license: "GPL",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "invert",
            name: "invert",
            type: "bit",
            direction: "rw",
          },
        ],
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'majority-of-3\' component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent maj3 "Compute the majority of 3 inputs";\n\npin in bit in1;\npin in bit in2;\npin in bit in3;\npin out bit out;\n\nparam rw bit invert;\n\nfunction _ nofp;\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:maj3:maj3",
        name: "maj3",
        halComponentName: "maj3",
        source: "comp",
        sourcePath: "src/hal/components/maj3.comp",
        docs: {
          component: "Compute the majority of 3 inputs",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "invert",
            name: "invert",
            type: "bit",
            direction: "rw",
          },
        ],
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a \'majority-of-3\' component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent maj3 "Compute the majority of 3 inputs";\n\npin in bit in1;\npin in bit in2;\npin in bit in3;\npin out bit out;\n\nparam rw bit invert;\n\nfunction _ nofp;\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:maj3:maj3",
        name: "maj3",
        halComponentName: "maj3",
        source: "comp",
        sourcePath: "src/hal/components/maj3.comp",
        docs: {
          component: "Compute the majority of 3 inputs",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "invert",
            name: "invert",
            type: "bit",
            direction: "rw",
          },
        ],
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
            '//   This is a \'majority-of-3\' component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent maj3 "Compute the majority of 3 inputs";\n\npin in bit in1;\npin in bit in2;\npin in bit in3;\npin out bit out;\n\nparam rw bit invert;\n\noption period no;\nfunction _ nofp;\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
