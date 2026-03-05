import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "div2",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:div2:div2",
        name: "div2",
        halComponentName: "div2",
        source: "comp",
        sourcePath: "src/hal/components/div2.comp",
        docs: {
          component: "Quotient of two floating point inputs",
          description:
            "\nA very simple comp to divide a floating point number\nby another floating point number, to get a floating point result.\nRemember, not to use a zero divisor. \nA zero divisor creates an indefinte result.\nThis is simple mathematics. ",
          license: "GPL",
          author: "Noel Rodes",
          seeAlso: "mult2(9), invert(9) ",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            doc: "the Dividend",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "the Divisor",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "the Quotient   out = in0 / in1",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2021 Noel Rodes\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n//\n//   Do not use a zero Divisor.\n//   Dividing by zero creates a bad, indefinite result.  NOT ALLOWED\n//   This is simple math.\n//\n\ncomponent div2 "Quotient of two floating point inputs";\npin in  float in0 "the Dividend";\npin in  float in1 "the Divisor";\npin out float out "the Quotient   out = in0 / in1";\nparam rw float deadband "The \\\\fBout\\\\fR will be zero if \\\\fBin\\\\fR is between -\\\\fBdeadband\\\\fR and +\\\\fBdeadband\\\\fR" ;\n\ndescription """\nA very simple comp to divide a floating point number\nby another floating point number, to get a floating point result.\nRemember, not to use a zero divisor. \nA zero divisor creates an indefinte result.\nThis is simple mathematics. """;\n\nlicense "GPL"; // indicates GPL v2 or later\nauthor "Noel Rodes";\nsee_also "mult2(9), invert(9) ";\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:div2:div2",
        name: "div2",
        halComponentName: "div2",
        source: "comp",
        sourcePath: "src/hal/components/div2.comp",
        docs: {
          component: "Quotient of two floating point inputs",
          description:
            "\nA very simple comp to divide a floating point number\nby another floating point number, to get a floating point result.\nRemember, not to use a zero divisor. \nA zero divisor creates an indefinte result.\nThis is simple mathematics. ",
          license: "GPL",
          author: "Noel Rodes",
          seeAlso: "mult2(9), invert(9) ",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            doc: "the Dividend",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            doc: "the Divisor",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "the Quotient   out = in0 / in1",
            direction: "out",
          },
        ],
        params: [
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            doc: "The *out* will be zero if *in* is between -*deadband* and +*deadband*",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2021 Noel Rodes\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n//\n//   Do not use a zero Divisor.\n//   Dividing by zero creates a bad, indefinite result.  NOT ALLOWED\n//   This is simple math.\n//\n\ncomponent div2 "Quotient of two floating point inputs";\npin in  float in0 "the Dividend";\npin in  float in1 "the Divisor";\npin out float out "the Quotient   out = in0 / in1";\nparam rw float deadband "The *out* will be zero if *in* is between -*deadband* and +*deadband*" ;\n\ndescription """\nA very simple comp to divide a floating point number\nby another floating point number, to get a floating point result.\nRemember, not to use a zero divisor. \nA zero divisor creates an indefinte result.\nThis is simple mathematics. """;\n\nlicense "GPL"; // indicates GPL v2 or later\nauthor "Noel Rodes";\nsee_also "mult2(9), invert(9) ";\noption period no;\nfunction _;\n\n',
        },
      },
    },
  ],
};

export default history;
