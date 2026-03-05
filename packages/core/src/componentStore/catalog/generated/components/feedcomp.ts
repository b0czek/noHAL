import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "feedcomp",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:feedcomp:feedcomp",
        name: "feedcomp",
        halComponentName: "feedcomp",
        source: "comp",
        sourcePath: "src/hal/components/feedcomp.comp",
        docs: {
          component:
            "Multiply the input by the ratio of current velocity to the feed rate",
          notes: "Note that if enable is false, out = in",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Proportionate output value",
            direction: "out",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Reference value",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Turn compensation on or off",
            direction: "in",
          },
          {
            key: "vel",
            name: "vel",
            type: "float",
            doc: "Current velocity",
            direction: "in",
          },
        ],
        params: [
          {
            key: "feed",
            name: "feed",
            type: "float",
            doc: "Feed rate reference value",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Eric H. Johnson\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent feedcomp "Multiply the input by the ratio of current velocity to the feed rate";\npin out float out "Proportionate output value";\npin in float in "Reference value";\npin in bit enable "Turn compensation on or off";\npin in float vel "Current velocity";\nparam rw float feed "Feed rate reference value";\nnotes "Note that if enable is false, out = in";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:feedcomp:feedcomp",
        name: "feedcomp",
        halComponentName: "feedcomp",
        source: "comp",
        sourcePath: "src/hal/components/feedcomp.comp",
        docs: {
          component:
            "Multiply the input by the ratio of current velocity to the feed rate",
          notes: "Note that if enable is false, out = in",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Proportionate output value",
            direction: "out",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Reference value",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Turn compensation on or off",
            direction: "in",
          },
          {
            key: "vel",
            name: "vel",
            type: "float",
            doc: "Current velocity",
            direction: "in",
          },
        ],
        params: [
          {
            key: "feed",
            name: "feed",
            type: "float",
            doc: "Feed rate reference value",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Eric H. Johnson\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent feedcomp "Multiply the input by the ratio of current velocity to the feed rate";\npin out float out "Proportionate output value";\npin in float in "Reference value";\npin in bit enable "Turn compensation on or off";\npin in float vel "Current velocity";\nparam rw float feed "Feed rate reference value";\nnotes "Note that if enable is false, out = in";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:feedcomp:feedcomp",
        name: "feedcomp",
        halComponentName: "feedcomp",
        source: "comp",
        sourcePath: "src/hal/components/feedcomp.comp",
        docs: {
          component:
            "Multiply the input by the ratio of current velocity to the feed rate.",
          notes: "Note that if enable is false, out = in.",
          license: "GPL",
          author: "Eric H. Johnson",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Proportionate output value",
            direction: "out",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Reference value",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Turn compensation on or off.",
            direction: "in",
          },
          {
            key: "vel",
            name: "vel",
            type: "float",
            doc: "Current velocity",
            direction: "in",
          },
        ],
        params: [
          {
            key: "feed",
            name: "feed",
            type: "float",
            doc: "Feed rate reference value",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Eric H. Johnson\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent feedcomp "Multiply the input by the ratio of current velocity to the feed rate.";\npin out float out "Proportionate output value";\npin in float in "Reference value";\npin in bit enable "Turn compensation on or off.";\npin in float vel "Current velocity";\nparam rw float feed "Feed rate reference value";\nnotes "Note that if enable is false, out = in.";\n\nfunction _;\nlicense "GPL";\nauthor "Eric H. Johnson";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:feedcomp:feedcomp",
        name: "feedcomp",
        halComponentName: "feedcomp",
        source: "comp",
        sourcePath: "src/hal/components/feedcomp.comp",
        docs: {
          component:
            "Multiply the input by the ratio of current velocity to the feed rate.",
          notes: "Note that if enable is false, out = in.",
          license: "GPL",
          author: "Eric H. Johnson",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Proportionate output value",
            direction: "out",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Reference value",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Turn compensation on or off.",
            direction: "in",
          },
          {
            key: "vel",
            name: "vel",
            type: "float",
            doc: "Current velocity",
            direction: "in",
          },
        ],
        params: [
          {
            key: "feed",
            name: "feed",
            type: "float",
            doc: "Feed rate reference value",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Eric H. Johnson\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent feedcomp "Multiply the input by the ratio of current velocity to the feed rate.";\npin out float out "Proportionate output value";\npin in float in "Reference value";\npin in bit enable "Turn compensation on or off.";\npin in float vel "Current velocity";\nparam rw float feed "Feed rate reference value";\nnotes "Note that if enable is false, out = in.";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Eric H. Johnson";\n',
        },
      },
    },
  ],
};

export default history;
