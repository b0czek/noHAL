import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "oneshot",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:oneshot:oneshot",
        name: "oneshot",
        halComponentName: "oneshot",
        source: "comp",
        sourcePath: "src/hal/components/oneshot.comp",
        docs: {
          component: "one-shot pulse generator",
          description:
            'creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".',
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Trigger input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Active high pulse",
            direction: "out",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "Active low pulse",
            direction: "out",
          },
          {
            key: "width",
            name: "width",
            type: "float",
            doc: "Pulse width in seconds",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "time_left",
            name: "time-left",
            type: "float",
            doc: "Time left in current output pulse",
            direction: "out",
          },
        ],
        params: [
          {
            key: "retriggerable",
            name: "retriggerable",
            type: "bit",
            doc: "Allow additional edges to extend pulse",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "rising",
            name: "rising",
            type: "bit",
            doc: "Trigger on rising edge",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "falling",
            name: "falling",
            type: "bit",
            doc: "Trigger on falling edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Produce output pulses from input edges",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "internal",
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 John Kasunich <jmkasunich@users.sourceforge.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent oneshot "one-shot pulse generator";\n\ndescription """creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".""";\n\npin in bit in "Trigger input";\npin out bit out "Active high pulse";\npin out bit out_not "Active low pulse";\npin in float width=0 "Pulse width in seconds";\npin out float time_left "Time left in current output pulse";\n\nparam rw bit retriggerable=TRUE "Allow additional edges to extend pulse";\nparam rw bit rising=TRUE "Trigger on rising edge";\nparam rw bit falling=FALSE "Trigger on falling edge";\n\noption data internal;\noption extra_setup yes;\n\nfunction _ "Produce output pulses from input edges";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:oneshot:oneshot",
        name: "oneshot",
        halComponentName: "oneshot",
        source: "comp",
        sourcePath: "src/hal/components/oneshot.comp",
        docs: {
          component: "one-shot pulse generator",
          description:
            'creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".',
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Trigger input",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Active high pulse",
            direction: "out",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "Active low pulse",
            direction: "out",
          },
          {
            key: "width",
            name: "width",
            type: "float",
            doc: "Pulse width in seconds",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "time_left",
            name: "time-left",
            type: "float",
            doc: "Time left in current output pulse",
            direction: "out",
          },
        ],
        params: [
          {
            key: "retriggerable",
            name: "retriggerable",
            type: "bit",
            doc: "Allow additional edges to extend pulse",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "rising",
            name: "rising",
            type: "bit",
            doc: "Trigger on rising edge",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "falling",
            name: "falling",
            type: "bit",
            doc: "Trigger on falling edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Produce output pulses from input edges",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "internal",
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for EMC2 HAL\n//   Copyright 2006 John Kasunich <jmkasunich@users.sourceforge.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent oneshot "one-shot pulse generator";\n\ndescription """creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".""";\n\npin in bit in "Trigger input";\npin in bit reset "Reset";\npin out bit out "Active high pulse";\npin out bit out_not "Active low pulse";\npin in float width=0 "Pulse width in seconds";\npin out float time_left "Time left in current output pulse";\n\nparam rw bit retriggerable=TRUE "Allow additional edges to extend pulse";\nparam rw bit rising=TRUE "Trigger on rising edge";\nparam rw bit falling=FALSE "Trigger on falling edge";\n\noption data internal;\noption extra_setup yes;\n\nfunction _ "Produce output pulses from input edges";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:oneshot:oneshot",
        name: "oneshot",
        halComponentName: "oneshot",
        source: "comp",
        sourcePath: "src/hal/components/oneshot.comp",
        docs: {
          component: "one-shot pulse generator",
          description:
            'creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".',
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Trigger input",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Active high pulse",
            direction: "out",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "Active low pulse",
            direction: "out",
          },
          {
            key: "width",
            name: "width",
            type: "float",
            doc: "Pulse width in seconds",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "time_left",
            name: "time-left",
            type: "float",
            doc: "Time left in current output pulse",
            direction: "out",
          },
        ],
        params: [
          {
            key: "retriggerable",
            name: "retriggerable",
            type: "bit",
            doc: "Allow additional edges to extend pulse",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "rising",
            name: "rising",
            type: "bit",
            doc: "Trigger on rising edge",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "falling",
            name: "falling",
            type: "bit",
            doc: "Trigger on falling edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Produce output pulses from input edges",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "internal",
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 John Kasunich <jmkasunich@users.sourceforge.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent oneshot "one-shot pulse generator";\n\ndescription """creates a variable-length output pulse when the input changes \nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1mS. \nFor a similar function that can run in the base thread, and which offers higher \nresolution, see "edge".""";\n\npin in bit in "Trigger input";\npin in bit reset "Reset";\npin out bit out "Active high pulse";\npin out bit out_not "Active low pulse";\npin in float width=0 "Pulse width in seconds";\npin out float time_left "Time left in current output pulse";\n\nparam rw bit retriggerable=TRUE "Allow additional edges to extend pulse";\nparam rw bit rising=TRUE "Trigger on rising edge";\nparam rw bit falling=FALSE "Trigger on falling edge";\n\noption data internal;\noption extra_setup yes;\n\nfunction _ "Produce output pulses from input edges";\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:oneshot:oneshot",
        name: "oneshot",
        halComponentName: "oneshot",
        source: "comp",
        sourcePath: "src/hal/components/oneshot.comp",
        docs: {
          component: "one-shot pulse generator",
          description:
            'creates a variable-length output pulse when the input changes\nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1ms.\nFor a similar function that can run in the base thread, and which offers higher\nresolution, see "edge".',
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Trigger input",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Active high pulse",
            direction: "out",
          },
          {
            key: "out_not",
            name: "out-not",
            type: "bit",
            doc: "Active low pulse",
            direction: "out",
          },
          {
            key: "width",
            name: "width",
            type: "float",
            doc: "Pulse width in seconds",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "time_left",
            name: "time-left",
            type: "float",
            doc: "Time left in current output pulse",
            direction: "out",
          },
        ],
        params: [
          {
            key: "retriggerable",
            name: "retriggerable",
            type: "bit",
            doc: "Allow additional edges to extend pulse",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "rising",
            name: "rising",
            type: "bit",
            doc: "Trigger on rising edge",
            defaultValue: "TRUE",
            direction: "rw",
          },
          {
            key: "falling",
            name: "falling",
            type: "bit",
            doc: "Trigger on falling edge",
            defaultValue: "FALSE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Produce output pulses from input edges",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "internal",
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2006 John Kasunich <jmkasunich@users.sourceforge.net>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent oneshot "one-shot pulse generator";\n\ndescription """creates a variable-length output pulse when the input changes\nstate. This function needs to run in a thread which supports floating point\n(typically the servo thread). This means that the pulse length has to be a\nmultiple of that thread period, typically 1ms.\nFor a similar function that can run in the base thread, and which offers higher\nresolution, see "edge".""";\n\npin in bit in "Trigger input";\npin in bit reset "Reset";\npin out bit out "Active high pulse";\npin out bit out_not "Active low pulse";\npin in float width=0 "Pulse width in seconds";\npin out float time_left "Time left in current output pulse";\n\nparam rw bit retriggerable=TRUE "Allow additional edges to extend pulse";\nparam rw bit rising=TRUE "Trigger on rising edge";\nparam rw bit falling=FALSE "Trigger on falling edge";\n\noption data internal;\noption extra_setup yes;\n\nfunction _ "Produce output pulses from input edges";\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
