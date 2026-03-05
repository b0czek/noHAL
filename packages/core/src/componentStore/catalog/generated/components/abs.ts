import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "abs",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:abs:abs",
        name: "abs",
        halComponentName: "abs",
        source: "comp",
        sourcePath: "src/hal/components/abs.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Analog input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Analog output value, always positive",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 John Kasunich <jmkasunich at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent abs "Compute the absolute value and sign of the input signal";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value, always positive";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:abs:abs",
        name: "abs",
        halComponentName: "abs",
        source: "comp",
        sourcePath: "src/hal/components/abs.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Analog input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Analog output value, always positive",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 John Kasunich <jmkasunich at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs "Compute the absolute value and sign of the input signal";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value, always positive";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:abs:abs",
        name: "abs",
        halComponentName: "abs",
        source: "comp",
        sourcePath: "src/hal/components/abs.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Analog input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Analog output value, always positive",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 John Kasunich <jmkasunich at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs "Compute the absolute value and sign of the input signal";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value, always positive";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:abs:abs",
        name: "abs",
        halComponentName: "abs",
        source: "comp",
        sourcePath: "src/hal/components/abs.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Analog input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Analog output value, always positive",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 John Kasunich <jmkasunich at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent abs "Compute the absolute value and sign of the input signal";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value, always positive";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "TRUE if input is positive, FALSE if input is 0 or negative";\npin out bit is_negative "TRUE if input is negative, FALSE if input is 0 or positive";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
