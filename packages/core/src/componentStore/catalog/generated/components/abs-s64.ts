import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "abs_s64",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:abs-s64:abs-s64",
        name: "abs_s64",
        halComponentName: "abs_s64",
        source: "comp",
        sourcePath: "src/hal/components/abs_s64.comp",
        docs: {
          component: "Compute the absolute value and sign of the input signal",
          license: "GPL",
          author: "ArcEye based on code from Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s64",
            doc: "input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s64",
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
            doc: "true if input is positive, false if input is 0 or negative",
            direction: "out",
          },
          {
            key: "is_negative",
            name: "is-negative",
            type: "bit",
            doc: "true if input is negative, false if input is 0 or positive",
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
            '//   This is a component for Machinekit\n//   Copyright 2011 Sebastian Kuzminsky <seb@highlab.com>\n//\n//   Adapted for 64 bit ArcEye <arceyeATmgwareDOTcoDOTuk>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent abs_s64 "Compute the absolute value and sign of the input signal";\n\npin in s64 in "input value" ;\npin out s64 out "output value, always non-negative";\npin out bit sign "Sign of input, false for positive, true for negative" ;\npin out bit is_positive "true if input is positive, false if input is 0 or negative";\npin out bit is_negative "true if input is negative, false if input is 0 or positive";\n\noption period no;\nfunction _ nofp;\nlicense "GPL";\nauthor "ArcEye based on code from Sebastian Kuzminsky";\n',
        },
      },
    },
  ],
};

export default history;
