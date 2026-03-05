import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "invert",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:invert:invert",
        name: "invert",
        halComponentName: "invert",
        source: "comp",
        sourcePath: "src/hal/components/invert.comp",
        docs: {
          component:
            "Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.",
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
            doc: "Analog output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            doc: "The \\fBout\\fR will be zero if \\fBin\\fR is between -\\fBdeadband\\fR and +\\fBdeadband\\fR",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Stephen Wille Padnos <swpadnos at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent invert """Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.""";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value";\nparam rw float deadband "The \\\\fBout\\\\fR will be zero if \\\\fBin\\\\fR is between -\\\\fBdeadband\\\\fR and +\\\\fBdeadband\\\\fR" ;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:invert:invert",
        name: "invert",
        halComponentName: "invert",
        source: "comp",
        sourcePath: "src/hal/components/invert.comp",
        docs: {
          component:
            "Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.",
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
            doc: "Analog output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            doc: "The \\fBout\\fR will be zero if \\fBin\\fR is between -\\fBdeadband\\fR and +\\fBdeadband\\fR",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Stephen Wille Padnos <swpadnos at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent invert """Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.""";\n\npin in float in "Analog input value" ;\npin out float out "Analog output value";\nparam rw float deadband "The \\\\fBout\\\\fR will be zero if \\\\fBin\\\\fR is between -\\\\fBdeadband\\\\fR and +\\\\fBdeadband\\\\fR" ;\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:invert:invert",
        name: "invert",
        halComponentName: "invert",
        source: "comp",
        sourcePath: "src/hal/components/invert.comp",
        docs: {
          component:
            "Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.",
          license: "GPL",
          author: "Stephen Wille Padnos",
          seeAlso: " invert(9), div2(9) ",
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
            doc: "Analog output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            doc: "The \\fBout\\fR will be zero if \\fBin\\fR is between -\\fBdeadband\\fR and +\\fBdeadband\\fR.",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Stephen Wille Padnos <swpadnos at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent invert """Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie \\\\fBout\\\\fR = 1/\\\\fBin\\\\fR.\nThe parameter \\\\fBdeadband\\\\fR can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0.  \\\\fBdeadband\\\\fR must be at least 1e-8, and must be positive.""";\n\npin in float in "Analog input value";\npin out float out "Analog output value";\nparam rw float deadband "The \\\\fBout\\\\fR will be zero if \\\\fBin\\\\fR is between -\\\\fBdeadband\\\\fR and +\\\\fBdeadband\\\\fR.";\n\nfunction _;\nlicense "GPL";\nauthor "Stephen Wille Padnos";\nsee_also " invert(9), div2(9) ";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:invert:invert",
        name: "invert",
        halComponentName: "invert",
        source: "comp",
        sourcePath: "src/hal/components/invert.comp",
        docs: {
          component:
            "Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie *out* = 1 / *in*.\nThe parameter *deadband* can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0. *deadband* must be at least 1e-8, and must be positive.",
          license: "GPL",
          author: "Stephen Wille Padnos",
          seeAlso: " invert(9), div2(9) ",
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
            doc: "Analog output value",
            direction: "out",
          },
        ],
        params: [
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            doc: "The *out* will be zero if *in* is between -*deadband* and +*deadband*.",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Stephen Wille Padnos <swpadnos at sourceforge dot net>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent invert """Compute the inverse of the input signal\nThe output will be the mathematical inverse of the input, ie *out* = 1 / *in*.\nThe parameter *deadband* can be used to control how close to 0 the denominator can be\nbefore the output is clamped to 0. *deadband* must be at least 1e-8, and must be positive.""";\n\npin in float in "Analog input value";\npin out float out "Analog output value";\nparam rw float deadband "The *out* will be zero if *in* is between -*deadband* and +*deadband*.";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Stephen Wille Padnos";\nsee_also " invert(9), div2(9) ";\n',
        },
      },
    },
  ],
};

export default history;
