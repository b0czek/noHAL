import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "abs_s32",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:abs-s32:abs-s32",
        name: "abs_s32",
        halComponentName: "abs_s32",
        source: "comp",
        sourcePath: "src/hal/components/abs_s32.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            doc: "input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "output value, always non-negative",
            direction: "out",
          },
          {
            key: "sign",
            name: "sign",
            type: "bit",
            doc: "Sign of input, false for positive, true for negative",
            direction: "out",
          },
          {
            key: "is_positive",
            name: "is-positive",
            type: "bit",
            doc: "TRUE if input is positive, FALSE if input is 0 or negative",
            direction: "out",
          },
          {
            key: "is_negative",
            name: "is-negative",
            type: "bit",
            doc: "TRUE if input is negative, FALSE if input is 0 or positive",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2011 Sebastian Kuzminsky <seb@highlab.com>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent abs_s32 "Compute the absolute value and sign of the input signal";\n\npin in s32 in "input value" ;\npin out s32 out "output value, always non-negative";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:abs-s32:abs-s32",
        name: "abs_s32",
        halComponentName: "abs_s32",
        source: "comp",
        sourcePath: "src/hal/components/abs_s32.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            doc: "input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "output value, always non-negative",
            direction: "out",
          },
          {
            key: "sign",
            name: "sign",
            type: "bit",
            doc: "Sign of input, false for positive, true for negative",
            direction: "out",
          },
          {
            key: "is_positive",
            name: "is-positive",
            type: "bit",
            doc: "TRUE if input is positive, FALSE if input is 0 or negative",
            direction: "out",
          },
          {
            key: "is_negative",
            name: "is-negative",
            type: "bit",
            doc: "TRUE if input is negative, FALSE if input is 0 or positive",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2011 Sebastian Kuzminsky <seb@highlab.com>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs_s32 "Compute the absolute value and sign of the input signal";\n\npin in s32 in "input value" ;\npin out s32 out "output value, always non-negative";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:abs-s32:abs-s32",
        name: "abs_s32",
        halComponentName: "abs_s32",
        source: "comp",
        sourcePath: "src/hal/components/abs_s32.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            doc: "input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "output value, always non-negative",
            direction: "out",
          },
          {
            key: "sign",
            name: "sign",
            type: "bit",
            doc: "Sign of input, false for positive, true for negative",
            direction: "out",
          },
          {
            key: "is_positive",
            name: "is-positive",
            type: "bit",
            doc: "TRUE if input is positive, FALSE if input is 0 or negative",
            direction: "out",
          },
          {
            key: "is_negative",
            name: "is-negative",
            type: "bit",
            doc: "TRUE if input is negative, FALSE if input is 0 or positive",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2011 Sebastian Kuzminsky <seb@highlab.com>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs_s32 "Compute the absolute value and sign of the input signal";\n\npin in s32 in "input value" ;\npin out s32 out "output value, always non-negative";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _ nofp;\nlicense "GPL";\nauthor "Sebastian Kuzminsky";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:abs-s32:abs-s32",
        name: "abs_s32",
        halComponentName: "abs_s32",
        source: "comp",
        sourcePath: "src/hal/components/abs_s32.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            doc: "input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "output value, always non-negative",
            direction: "out",
          },
          {
            key: "sign",
            name: "sign",
            type: "bit",
            doc: "Sign of input, false for positive, true for negative",
            direction: "out",
          },
          {
            key: "is_positive",
            name: "is-positive",
            type: "bit",
            doc: "TRUE if input is positive, FALSE if input is 0 or negative",
            direction: "out",
          },
          {
            key: "is_negative",
            name: "is-negative",
            type: "bit",
            doc: "TRUE if input is negative, FALSE if input is 0 or positive",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2011 Sebastian Kuzminsky <seb@highlab.com>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs_s32 "Compute the absolute value and sign of the input signal";\n\npin in s32 in "input value" ;\npin out s32 out "output value, always non-negative";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "Sebastian Kuzminsky";\n',
        },
      },
    },
  ],
};

export default history;
