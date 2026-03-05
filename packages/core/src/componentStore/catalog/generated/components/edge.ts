import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "edge",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:edge:edge",
        name: "edge",
        halComponentName: "edge",
        source: "comp",
        sourcePath: "src/hal/components/edge.comp",
        docs: {
          component: "Edge detector",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Goes high when the desired edge is seen on 'in'",
            direction: "out",
          },
          {
            key: "out_invert",
            name: "out-invert",
            type: "bit",
            doc: "Goes low when the desired edge is seen on 'in'",
            direction: "out",
          },
        ],
        params: [
          {
            key: "both",
            name: "both",
            type: "bit",
            doc: "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
          {
            key: "in_edge",
            name: "in-edge",
            type: "bit",
            doc: "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "out_width_ns",
            name: "out-width-ns",
            type: "s32",
            doc: "Time in nanoseconds of the output pulse",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "time_left_ns",
            name: "time-left-ns",
            type: "s32",
            doc: "Time left in this output pulse",
            direction: "r",
          },
          {
            key: "last_in",
            name: "last-in",
            type: "bit",
            doc: "Previous input value",
            direction: "r",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Produce output pulses from input edges",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\ncomponent edge "Edge detector";\n\npin in bit in;\npin out bit out "Goes high when the desired edge is seen on \'in\'";\npin out bit out_invert "Goes low when the desired edge is seen on \'in\'";\n\nparam rw bit both=FALSE "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge";\nparam rw bit in_edge=TRUE "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising";\nparam rw signed out_width_ns=0 "Time in nanoseconds of the output pulse";\n\nparam r signed time_left_ns "Time left in this output pulse";\nparam r bit last_in "Previous input value";\nvariable int first = 1;\n\nfunction _ nofp "Produce output pulses from input edges";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:edge:edge",
        name: "edge",
        halComponentName: "edge",
        source: "comp",
        sourcePath: "src/hal/components/edge.comp",
        docs: {
          component: "Edge detector",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Goes high when the desired edge is seen on 'in'",
            direction: "out",
          },
          {
            key: "out_invert",
            name: "out-invert",
            type: "bit",
            doc: "Goes low when the desired edge is seen on 'in'",
            direction: "out",
          },
        ],
        params: [
          {
            key: "both",
            name: "both",
            type: "bit",
            doc: "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
          {
            key: "in_edge",
            name: "in-edge",
            type: "bit",
            doc: "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "out_width_ns",
            name: "out-width-ns",
            type: "s32",
            doc: "Time in nanoseconds of the output pulse",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "time_left_ns",
            name: "time-left-ns",
            type: "s32",
            doc: "Time left in this output pulse",
            direction: "r",
          },
          {
            key: "last_in",
            name: "last-in",
            type: "bit",
            doc: "Previous input value",
            direction: "r",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Produce output pulses from input edges",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent edge "Edge detector";\n\npin in bit in;\npin out bit out "Goes high when the desired edge is seen on \'in\'";\npin out bit out_invert "Goes low when the desired edge is seen on \'in\'";\n\nparam rw bit both=FALSE "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge";\nparam rw bit in_edge=TRUE "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising";\nparam rw signed out_width_ns=0 "Time in nanoseconds of the output pulse";\n\nparam r signed time_left_ns "Time left in this output pulse";\nparam r bit last_in "Previous input value";\nvariable int first = 1;\n\nfunction _ nofp "Produce output pulses from input edges";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:edge:edge",
        name: "edge",
        halComponentName: "edge",
        source: "comp",
        sourcePath: "src/hal/components/edge.comp",
        docs: {
          component: "Edge detector",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Goes high when the desired edge is seen on 'in'",
            direction: "out",
          },
          {
            key: "out_invert",
            name: "out-invert",
            type: "bit",
            doc: "Goes low when the desired edge is seen on 'in'",
            direction: "out",
          },
        ],
        params: [
          {
            key: "both",
            name: "both",
            type: "bit",
            doc: "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
          {
            key: "in_edge",
            name: "in-edge",
            type: "bit",
            doc: "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "out_width_ns",
            name: "out-width-ns",
            type: "s32",
            doc: "Time in nanoseconds of the output pulse",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "time_left_ns",
            name: "time-left-ns",
            type: "s32",
            doc: "Time left in this output pulse",
            direction: "r",
          },
          {
            key: "last_in",
            name: "last-in",
            type: "bit",
            doc: "Previous input value",
            direction: "r",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Produce output pulses from input edges",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 Jeff Epler <jepler@unpythonic.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\ncomponent edge "Edge detector";\n\npin in bit in;\npin out bit out "Goes high when the desired edge is seen on \'in\'";\npin out bit out_invert "Goes low when the desired edge is seen on \'in\'";\n\nparam rw bit both=FALSE "If TRUE, selects both edges.  Otherwise, selects one edge according to in-edge";\nparam rw bit in_edge=TRUE "If both is FALSE, selects the one desired edge: TRUE means falling, FALSE means rising";\nparam rw signed out_width_ns=0 "Time in nanoseconds of the output pulse";\n\nparam r signed time_left_ns "Time left in this output pulse";\nparam r bit last_in "Previous input value";\nvariable int first = 1;\n\nfunction _ nofp "Produce output pulses from input edges";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
