import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "offset",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:offset:offset",
        name: "offset",
        halComponentName: "offset",
        source: "comp",
        sourcePath: "src/hal/components/offset.comp",
        docs: {
          component:
            "Adds an offset to an input, and subtracts it from the feedback value",
          license: "GPL",
        },
        pins: [
          {
            key: "offset",
            name: "offset",
            type: "float",
            doc: "The offset value",
            direction: "in",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The output value",
            direction: "out",
          },
          {
            key: "fb_in",
            name: "fb-in",
            type: "float",
            doc: "The feedback input value",
            direction: "in",
          },
          {
            key: "fb_out",
            name: "fb-out",
            type: "float",
            doc: "The feedback output value",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update_output",
            declaredName: "update_output",
            halSuffix: "update-output",
            floatMode: "fp",
            doc: "Updated the output value by adding the offset to the input",
          },
          {
            key: "update_feedback",
            declaredName: "update_feedback",
            halSuffix: "update-feedback",
            floatMode: "fp",
            doc: "Update the feedback value by subtracting the offset from the feedback",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent offset "Adds an offset to an input, and subtracts it from the feedback value";\n\nfunction update_output "Updated the output value by adding the offset to the input";\nfunction update_feedback "Update the feedback value by subtracting the offset from the feedback";\n\npin in float offset "The offset value";\n\npin in float in "The input value";\npin out float out "The output value";\n\npin in float fb_in "The feedback input value";\npin out float fb_out "The feedback output value";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:offset:offset",
        name: "offset",
        halComponentName: "offset",
        source: "comp",
        sourcePath: "src/hal/components/offset.comp",
        docs: {
          component:
            "Adds an offset to an input, and subtracts it from the feedback value",
          license: "GPL",
        },
        pins: [
          {
            key: "offset",
            name: "offset",
            type: "float",
            doc: "The offset value",
            direction: "in",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The output value",
            direction: "out",
          },
          {
            key: "fb_in",
            name: "fb-in",
            type: "float",
            doc: "The feedback input value",
            direction: "in",
          },
          {
            key: "fb_out",
            name: "fb-out",
            type: "float",
            doc: "The feedback output value",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update_output",
            declaredName: "update_output",
            halSuffix: "update-output",
            floatMode: "fp",
            doc: "Updated the output value by adding the offset to the input",
          },
          {
            key: "update_feedback",
            declaredName: "update_feedback",
            halSuffix: "update-feedback",
            floatMode: "fp",
            doc: "Update the feedback value by subtracting the offset from the feedback",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent offset "Adds an offset to an input, and subtracts it from the feedback value";\n\nfunction update_output "Updated the output value by adding the offset to the input";\nfunction update_feedback "Update the feedback value by subtracting the offset from the feedback";\n\npin in float offset "The offset value";\n\npin in float in "The input value";\npin out float out "The output value";\n\npin in float fb_in "The feedback input value";\npin out float fb_out "The feedback output value";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:offset:offset",
        name: "offset",
        halComponentName: "offset",
        source: "comp",
        sourcePath: "src/hal/components/offset.comp",
        docs: {
          component:
            "Adds an offset to an input, and subtracts it from the feedback value.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "offset",
            name: "offset",
            type: "float",
            doc: "The offset value",
            direction: "in",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The output value",
            direction: "out",
          },
          {
            key: "fb_in",
            name: "fb-in",
            type: "float",
            doc: "The feedback input value",
            direction: "in",
          },
          {
            key: "fb_out",
            name: "fb-out",
            type: "float",
            doc: "The feedback output value",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update_output",
            declaredName: "update_output",
            halSuffix: "update-output",
            floatMode: "fp",
            doc: "Updated the output value by adding the offset to the input.",
          },
          {
            key: "update_feedback",
            declaredName: "update_feedback",
            halSuffix: "update-feedback",
            floatMode: "fp",
            doc: "Update the feedback value by subtracting the offset from the feedback.",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent offset "Adds an offset to an input, and subtracts it from the feedback value.";\n\nfunction update_output "Updated the output value by adding the offset to the input.";\nfunction update_feedback "Update the feedback value by subtracting the offset from the feedback.";\n\npin in float offset "The offset value";\n\npin in float in "The input value";\npin out float out "The output value";\n\npin in float fb_in "The feedback input value";\npin out float fb_out "The feedback output value";\n\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:offset:offset",
        name: "offset",
        halComponentName: "offset",
        source: "comp",
        sourcePath: "src/hal/components/offset.comp",
        docs: {
          component:
            "Adds an offset to an input, and subtracts it from the feedback value.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "offset",
            name: "offset",
            type: "float",
            doc: "The offset value",
            direction: "in",
          },
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The output value",
            direction: "out",
          },
          {
            key: "fb_in",
            name: "fb-in",
            type: "float",
            doc: "The feedback input value",
            direction: "in",
          },
          {
            key: "fb_out",
            name: "fb-out",
            type: "float",
            doc: "The feedback output value",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update_output",
            declaredName: "update_output",
            halSuffix: "update-output",
            floatMode: "fp",
            doc: "Updated the output value by adding the offset to the input.",
          },
          {
            key: "update_feedback",
            declaredName: "update_feedback",
            halSuffix: "update-feedback",
            floatMode: "fp",
            doc: "Update the feedback value by subtracting the offset from the feedback.",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent offset "Adds an offset to an input, and subtracts it from the feedback value.";\n\nfunction update_output "Updated the output value by adding the offset to the input.";\nfunction update_feedback "Update the feedback value by subtracting the offset from the feedback.";\n\npin in float offset "The offset value";\n\npin in float in "The input value";\npin out float out "The output value";\n\npin in float fb_in "The feedback input value";\npin out float fb_out "The feedback output value";\n\nlicense "GPL";\nauthor "Jeff Epler";\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
