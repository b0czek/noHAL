import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "knob2float",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:knob2float:knob2float",
        name: "knob2float",
        halComponentName: "knob2float",
        source: "comp",
        sourcePath: "src/hal/components/knob2float.comp",
        docs: {
          component:
            "Convert counts (probably from an encoder) to a float value",
          license: "GPL",
        },
        pins: [
          {
            key: "counts",
            name: "counts",
            type: "s32",
            doc: "Counts",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, output is controlled by count, when FALSE, output is fixed",
            direction: "in",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "Amount of output change per count",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "max_out",
            name: "max-out",
            type: "float",
            doc: "Maximum output value, further increases in count will be ignored",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "min_out",
            name: "min-out",
            type: "float",
            doc: "Minimum output value, further decreases in count will be ignored",
            defaultValue: "0.0",
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
            data: "knob2float_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2007 John Kasunich <jmkasunich AT sourceforge DOT net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent knob2float "Convert counts (probably from an encoder) to a float value";\n\npin in s32 counts "Counts";\npin in bit enable "When TRUE, output is controlled by count, when FALSE, output is fixed";\npin in float scale "Amount of output change per count";\npin out float out "Output value";\n\nparam rw float max_out=1.0 "Maximum output value, further increases in count will be ignored";\nparam rw float min_out=0.0 "Minimum output value, further decreases in count will be ignored";\n\noption data knob2float_data;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:knob2float:knob2float",
        name: "knob2float",
        halComponentName: "knob2float",
        source: "comp",
        sourcePath: "src/hal/components/knob2float.comp",
        docs: {
          component:
            "Convert counts (probably from an encoder) to a float value",
          license: "GPL",
        },
        pins: [
          {
            key: "counts",
            name: "counts",
            type: "s32",
            doc: "Counts",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, output is controlled by count, when FALSE, output is fixed",
            direction: "in",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "Amount of output change per count",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "max_out",
            name: "max-out",
            type: "float",
            doc: "Maximum output value, further increases in count will be ignored",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "min_out",
            name: "min-out",
            type: "float",
            doc: "Minimum output value, further decreases in count will be ignored",
            defaultValue: "0.0",
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
            data: "knob2float_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2007 John Kasunich <jmkasunich AT sourceforge DOT net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent knob2float "Convert counts (probably from an encoder) to a float value";\n\npin in s32 counts "Counts";\npin in bit enable "When TRUE, output is controlled by count, when FALSE, output is fixed";\npin in float scale "Amount of output change per count";\npin out float out "Output value";\n\nparam rw float max_out=1.0 "Maximum output value, further increases in count will be ignored";\nparam rw float min_out=0.0 "Minimum output value, further decreases in count will be ignored";\n\noption data knob2float_data;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:knob2float:knob2float",
        name: "knob2float",
        halComponentName: "knob2float",
        source: "comp",
        sourcePath: "src/hal/components/knob2float.comp",
        docs: {
          component:
            "Convert counts (probably from an encoder) to a float value",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "counts",
            name: "counts",
            type: "s32",
            doc: "Counts",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, output is controlled by count, when FALSE, output is fixed",
            direction: "in",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "Amount of output change per count",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "max_out",
            name: "max-out",
            type: "float",
            doc: "Maximum output value, further increases in count will be ignored",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "min_out",
            name: "min-out",
            type: "float",
            doc: "Minimum output value, further decreases in count will be ignored",
            defaultValue: "0.0",
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
            data: "knob2float_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2007 John Kasunich <jmkasunich AT sourceforge DOT net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent knob2float "Convert counts (probably from an encoder) to a float value";\n\npin in s32 counts "Counts";\npin in bit enable "When TRUE, output is controlled by count, when FALSE, output is fixed";\npin in float scale "Amount of output change per count";\npin out float out "Output value";\n\nparam rw float max_out=1.0 "Maximum output value, further increases in count will be ignored";\nparam rw float min_out=0.0 "Minimum output value, further decreases in count will be ignored";\n\noption data knob2float_data;\n\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:knob2float:knob2float",
        name: "knob2float",
        halComponentName: "knob2float",
        source: "comp",
        sourcePath: "src/hal/components/knob2float.comp",
        docs: {
          component:
            "Convert counts (probably from an encoder) to a float value",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "counts",
            name: "counts",
            type: "s32",
            doc: "Counts",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, output is controlled by count, when FALSE, output is fixed",
            direction: "in",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "Amount of output change per count",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "max_out",
            name: "max-out",
            type: "float",
            doc: "Maximum output value, further increases in count will be ignored",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "min_out",
            name: "min-out",
            type: "float",
            doc: "Minimum output value, further decreases in count will be ignored",
            defaultValue: "0.0",
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
            data: "knob2float_data",
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2007 John Kasunich <jmkasunich AT sourceforge DOT net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent knob2float "Convert counts (probably from an encoder) to a float value";\n\npin in s32 counts "Counts";\npin in bit enable "When TRUE, output is controlled by count, when FALSE, output is fixed";\npin in float scale "Amount of output change per count";\npin out float out "Output value";\n\nparam rw float max_out=1.0 "Maximum output value, further increases in count will be ignored";\nparam rw float min_out=0.0 "Minimum output value, further decreases in count will be ignored";\n\noption data knob2float_data;\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
