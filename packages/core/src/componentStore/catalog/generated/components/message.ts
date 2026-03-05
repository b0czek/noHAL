import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "message",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:message:message",
        name: "message",
        halComponentName: "message",
        source: "comp",
        sourcePath: "src/hal/components/message.comp",
        docs: {
          component: "Display a message",
          description:
            'Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.',
          license: "GPL v2",
        },
        pins: [
          {
            key: "trigger",
            name: "trigger",
            type: "bit",
            doc: "signal that triggers the message",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "force",
            name: "force",
            type: "bit",
            doc: "A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active",
            defaultValue: "FALSE",
            direction: "in",
          },
        ],
        params: [
          {
            key: "edge",
            name: "edge",
            type: "bit",
            doc: "Selects the desired edge: TRUE means falling, FALSE\nmeans rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Display a message",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  message.comp\n*               Message HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*    \n* Copyright (c) 2011 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111 USA\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the EMC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n \ncomponent message "Display a message";\n \ndescription """Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.""";\n \npin in bit trigger =FALSE "signal that triggers the message";\npin in bit force =FALSE """A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active""";\n \nparam rw bit edge =TRUE """Selects the desired edge: TRUE means falling, FALSE\nmeans rising""";\n\nmodparam dummy messages """The messages to display. These should be listed,\ncomma-delimited, inside a single set of quotes. See the "Description" section\nfor an example.\nIf there are more messages than "count" or "names" then the excess will be\nignored. If there are fewer messages than "count" or "names" then an error will\nbe raised and the component will not load.""";\n \nvariable int myidx;\nvariable hal_bit_t prev_trigger = FALSE;\nvariable hal_bit_t prev_force = TRUE;\nvariable hal_bit_t prev_edge = TRUE;\n \noption extra_setup yes;\n \nfunction _ nofp "Display a message";\nlicense "GPL v2";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:message:message",
        name: "message",
        halComponentName: "message",
        source: "comp",
        sourcePath: "src/hal/components/message.comp",
        docs: {
          component: "Display a message",
          description:
            'Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.',
          license: "GPL v2",
        },
        pins: [
          {
            key: "trigger",
            name: "trigger",
            type: "bit",
            doc: "signal that triggers the message",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "force",
            name: "force",
            type: "bit",
            doc: "A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active",
            defaultValue: "FALSE",
            direction: "in",
          },
        ],
        params: [
          {
            key: "edge",
            name: "edge",
            type: "bit",
            doc: "Selects the desired edge: TRUE means falling, FALSE\nmeans rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Display a message",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  message.comp\n*               Message HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*    \n* Copyright (c) 2011 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the EMC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n \ncomponent message "Display a message";\n \ndescription """Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.""";\n \npin in bit trigger =FALSE "signal that triggers the message";\npin in bit force =FALSE """A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active""";\n \nparam rw bit edge =TRUE """Selects the desired edge: TRUE means falling, FALSE\nmeans rising""";\n\nmodparam dummy messages """The messages to display. These should be listed,\ncomma-delimited, inside a single set of quotes. See the "Description" section\nfor an example.\nIf there are more messages than "count" or "names" then the excess will be\nignored. If there are fewer messages than "count" or "names" then an error will\nbe raised and the component will not load.""";\n \nvariable int myidx;\nvariable hal_bit_t prev_trigger = FALSE;\nvariable hal_bit_t prev_force = TRUE;\nvariable hal_bit_t prev_edge = TRUE;\n \noption extra_setup yes;\n \nfunction _ nofp "Display a message";\nlicense "GPL v2";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:message:message",
        name: "message",
        halComponentName: "message",
        source: "comp",
        sourcePath: "src/hal/components/message.comp",
        docs: {
          component: "Display a message",
          description:
            'Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.',
          license: "GPL v2",
          author: "Les Newell",
        },
        pins: [
          {
            key: "trigger",
            name: "trigger",
            type: "bit",
            doc: "signal that triggers the message",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "force",
            name: "force",
            type: "bit",
            doc: "A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active",
            defaultValue: "FALSE",
            direction: "in",
          },
        ],
        params: [
          {
            key: "edge",
            name: "edge",
            type: "bit",
            doc: "Selects the desired edge: FALSE means falling, TRUE\nmeans rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Display a message",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  message.comp\n*               Message HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*    \n* Copyright (c) 2011 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the LinuxCNC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n \ncomponent message "Display a message";\n \ndescription """Allows HAL pins to trigger a message. Example hal commands:\n loadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil\npressure,Spindle inverter fault"\n addf oillow servo-thread\n addf oilpressure servo-thread\n addf inverterfail servo-thread\n \n setp oillow.edge 0 #this pin should be active low\n net no-oil classicladder.0.out-21 oillow.trigger\n net no-pressure classicladder.0.out-22 oilpressure.trigger\n net no-inverter classicladder.0.out-23 inverterfail.trigger\n \nWhen any pin goes active, the corresponding message will be displayed.""";\n \npin in bit trigger =FALSE "signal that triggers the message";\npin in bit force =FALSE """A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active""";\n \nparam rw bit edge =TRUE """Selects the desired edge: FALSE means falling, TRUE\nmeans rising""";\n\nmodparam dummy messages """The messages to display. These should be listed,\ncomma-delimited, inside a single set of quotes. See the "Description" section\nfor an example.\nIf there are more messages than "count" or "names" then the excess will be\nignored. If there are fewer messages than "count" or "names" then an error will\nbe raised and the component will not load.""";\n \nvariable int myidx;\nvariable hal_bit_t prev_trigger = FALSE;\nvariable hal_bit_t prev_force = TRUE;\nvariable hal_bit_t prev_edge = TRUE;\n \noption extra_setup yes;\n \nfunction _ nofp "Display a message";\nlicense "GPL v2";\nauthor "Les Newell";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:message:message",
        name: "message",
        halComponentName: "message",
        source: "comp",
        sourcePath: "src/hal/components/message.comp",
        docs: {
          component: "Display a message",
          description:
            'Allows HAL pins to trigger a message. Example hal commands:\n\n[source,hal]\n----\nloadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil pressure,Spindle inverter fault"\naddf oillow servo-thread\naddf oilpressure servo-thread\naddf inverterfail servo-thread\n\nsetp oillow.edge 0 #this pin should be active low\nnet no-oil classicladder.0.out-21 oillow.trigger\nnet no-pressure classicladder.0.out-22 oilpressure.trigger\nnet no-inverter classicladder.0.out-23 inverterfail.trigger\n----\n\nWhen any pin goes active, the corresponding message will be displayed.',
          license: "GPL v2",
          author: "Les Newell",
        },
        pins: [
          {
            key: "trigger",
            name: "trigger",
            type: "bit",
            doc: "signal that triggers the message",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "force",
            name: "force",
            type: "bit",
            doc: "A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active",
            defaultValue: "FALSE",
            direction: "in",
          },
        ],
        params: [
          {
            key: "edge",
            name: "edge",
            type: "bit",
            doc: "Selects the desired edge: FALSE means falling, TRUE\nmeans rising",
            defaultValue: "TRUE",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Display a message",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            extra_setup: true,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  message.comp\n*               Message HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*    \n* Copyright (c) 2011 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the LinuxCNC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n \ncomponent message "Display a message";\n \ndescription """Allows HAL pins to trigger a message. Example hal commands:\n\n[source,hal]\n----\nloadrt message names=oillow,oilpressure,inverterfail messages="Slideway oil low,No oil pressure,Spindle inverter fault"\naddf oillow servo-thread\naddf oilpressure servo-thread\naddf inverterfail servo-thread\n\nsetp oillow.edge 0 #this pin should be active low\nnet no-oil classicladder.0.out-21 oillow.trigger\nnet no-pressure classicladder.0.out-22 oilpressure.trigger\nnet no-inverter classicladder.0.out-23 inverterfail.trigger\n----\n\nWhen any pin goes active, the corresponding message will be displayed.""";\n \npin in bit trigger =FALSE "signal that triggers the message";\npin in bit force =FALSE """A FALSE->TRUE transition forces the message to be\ndisplayed again if the trigger is active""";\n \nparam rw bit edge =TRUE """Selects the desired edge: FALSE means falling, TRUE\nmeans rising""";\n\nmodparam dummy messages """The messages to display. These should be listed,\ncomma-delimited, inside a single set of quotes. See the "Description" section\nfor an example.\nIf there are more messages than "count" or "names" then the excess will be\nignored. If there are fewer messages than "count" or "names" then an error will\nbe raised and the component will not load.""";\n \nvariable int myidx;\nvariable hal_bit_t prev_trigger = FALSE;\nvariable hal_bit_t prev_force = TRUE;\nvariable hal_bit_t prev_edge = TRUE;\n \noption extra_setup yes;\n \noption period no;\nfunction _ nofp "Display a message";\nlicense "GPL v2";\nauthor "Les Newell";\n',
        },
      },
    },
  ],
};

export default history;
