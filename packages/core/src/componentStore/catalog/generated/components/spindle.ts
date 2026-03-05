import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "spindle",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:spindle:spindle",
        name: "spindle",
        halComponentName: "spindle",
        source: "comp",
        sourcePath: "src/hal/components/spindle.comp",
        docs: {
          component:
            "Control a spindle with different acceleration and deceleration and optional gear change scaling",
          description:
            "This component will control a spindle with adjustable \nacceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with\n names very much like those created by the motion component\n In nearly every case this is not the documentation page that you are\n looking for. See\n http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate \nfwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and \ndeceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with \nup to 16 gears. Each gear has individual control of speeds, acceleration, \ndriver gain and direction.",
          notes:
            "\n.TP\n.B The following pins are created depending the 'gears=' parameter.\nOne of each pin is created for each gear. If no gears are specified then one\ngear will be created. For instance if you have gears=1 on your command line,\nyou will have  two scale pins:\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.0\\\\fP\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.1\\\\fP\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.\\\\fPx float in\nScale the output. For multiple gears you would use a different scale for each \ngear. If you need to reverse the output for some gears, use a negative scale.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.min.\\\\fPx float in\nSet the minimum speed allowed (in RPM). The limit output will be TRUE while the \ncommanded speed is between 0 RPM and the min speed.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.max.\\\\fPx float in\nSet the maximum speed allowed (in RPM). The limit output will be TRUE while the \ncommanded speed is above this value\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.accel.\\\\fPx float in\nSet the maximum acceleration. If you do not have a spindle encoder this is in \nRPM/second. If you do have an encoder the output is the actual speed plus this \nvalue. This way the acceleration can be dependent on the spindle load.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.decel.\\\\fPx float in\nSet the minimum deceleration. If you do not have a spindle encoder this is in \nRPM/second. If you do have an encoder the output is the actual speed minus this \nvalue.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.speed-tolerance.\\\\fPx float in\nTolerance for 'at-speed' signal (in RPM). Actual spindle speeds within this \namount of the commanded speed will cause the at-speed signal to go TRUE.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.zero-tolerance.\\\\fPx float in\nTolerance for 'zero-speed' signal (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.offset.\\\\fPx float in\nThe output command is offset by this amount (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.select.\\\\fPx bit in\nSelects this gear. If no select inputs are active, gear 0 is selected. If \nmultiple select inputs are active the highest is selected.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "select_gear",
            name: "select-gear",
            type: "u32",
            doc: "Select a gear. Must be in the range 0 -> number of available gears  -1.\nIf you use this, do not use the select.x input pins.",
            direction: "in",
          },
          {
            key: "commanded_speed",
            name: "commanded-speed",
            type: "float",
            doc: "Commanded spindle speed (in RPM)",
            direction: "in",
          },
          {
            key: "actual_speed",
            name: "actual-speed",
            type: "float",
            doc: "Actual spindle speed from a spindle encoder (in \nRPS)\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1",
            direction: "in",
          },
          {
            key: "simulate_encoder",
            name: "simulate-encoder",
            type: "bit",
            doc: "If you do not have an encoder, set this to 1",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, the spindle is stopped at the gear's maximum deceleration",
            direction: "in",
          },
          {
            key: "spindle_lpf",
            name: "spindle-lpf",
            type: "float",
            doc: "Smooth the spindle-rpm-abs output when at speed. 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is",
            direction: "in",
          },
          {
            key: "spindle_rpm",
            name: "spindle-rpm",
            type: "float",
            doc: "Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.",
            direction: "out",
          },
          {
            key: "spindle_rpm_abs",
            name: "spindle-rpm-abs",
            type: "float",
            doc: "Absolute spindle speed in RPM. Useful for spindle speed displays",
            direction: "out",
          },
          {
            key: "output",
            name: "output",
            type: "float",
            doc: "Scaled output",
            direction: "out",
          },
          {
            key: "current_gear",
            name: "current-gear",
            type: "u32",
            doc: "Currently selected gear.",
            direction: "out",
          },
          {
            key: "at_speed",
            name: "at-speed",
            type: "bit",
            doc: "TRUE when the spindle is at speed",
            direction: "out",
          },
          {
            key: "forward",
            name: "forward",
            type: "bit",
            doc: "TRUE for forward rotation",
            direction: "out",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.",
            direction: "out",
          },
          {
            key: "brake",
            name: "brake",
            type: "bit",
            doc: "TRUE when decelerating",
            direction: "out",
          },
          {
            key: "zero_speed",
            name: "zero-speed",
            type: "bit",
            doc: "TRUE when the spindle is stationary",
            direction: "out",
          },
          {
            key: "limited",
            name: "limited",
            type: "bit",
            doc: "TRUE when the commanded spindle speed is >max or <min.",
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
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  spindle.comp\n*               Spindle HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*\n* Copyright (c) 2009 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111 USA\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the EMC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n\ncomponent spindle "Control a spindle with different acceleration and deceleration and optional gear change scaling";\n\ndescription """This component will control a spindle with adjustable \nacceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with\n names very much like those created by the motion component\n In nearly every case this is not the documentation page that you are\n looking for. See\n http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate \nfwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and \ndeceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with \nup to 16 gears. Each gear has individual control of speeds, acceleration, \ndriver gain and direction.""";\n\n\npin in unsigned select-gear\n"""Select a gear. Must be in the range 0 -> number of available gears  -1.\nIf you use this, do not use the select.x input pins.""";\n\npin in float commanded-speed "Commanded spindle speed (in RPM)";\npin in float actual-speed """Actual spindle speed from a spindle encoder (in \nRPS)\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1""";\npin in bit simulate-encoder "If you do not have an encoder, set this to 1";\npin in bit enable "If FALSE, the spindle is stopped at the gear\'s maximum deceleration";\npin in float spindle-lpf """Smooth the spindle-rpm-abs output when at speed. 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is""";\n\npin out float spindle-rpm """Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.""";\n\npin out float spindle-rpm-abs "Absolute spindle speed in RPM. Useful for spindle speed displays";\npin out float output "Scaled output";\npin out unsigned current-gear "Currently selected gear.";\n\npin out bit at-speed "TRUE when the spindle is at speed";\npin out bit forward "TRUE for forward rotation";\npin out bit reverse "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.";\npin out bit brake "TRUE when decelerating";\npin out bit zero-speed "TRUE when the spindle is stationary";\npin out bit limited """TRUE when the commanded spindle speed is >max or <min.""";\n\nnotes """\n.TP\n.B The following pins are created depending the \'gears=\' parameter.\nOne of each pin is created for each gear. If no gears are specified then one\ngear will be created. For instance if you have gears=1 on your command line,\nyou will have  two scale pins:\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.0\\\\fP\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.1\\\\fP\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.\\\\fPx float in\nScale the output. For multiple gears you would use a different scale for each \ngear. If you need to reverse the output for some gears, use a negative scale.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.min.\\\\fPx float in\nSet the minimum speed allowed (in RPM). The limit output will be TRUE while the \ncommanded speed is between 0 RPM and the min speed.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.max.\\\\fPx float in\nSet the maximum speed allowed (in RPM). The limit output will be TRUE while the \ncommanded speed is above this value\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.accel.\\\\fPx float in\nSet the maximum acceleration. If you do not have a spindle encoder this is in \nRPM/second. If you do have an encoder the output is the actual speed plus this \nvalue. This way the acceleration can be dependent on the spindle load.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.decel.\\\\fPx float in\nSet the minimum deceleration. If you do not have a spindle encoder this is in \nRPM/second. If you do have an encoder the output is the actual speed minus this \nvalue.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.speed-tolerance.\\\\fPx float in\nTolerance for \'at-speed\' signal (in RPM). Actual spindle speeds within this \namount of the commanded speed will cause the at-speed signal to go TRUE.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.zero-tolerance.\\\\fPx float in\nTolerance for \'zero-speed\' signal (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.offset.\\\\fPx float in\nThe output command is offset by this amount (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.select.\\\\fPx bit in\nSelects this gear. If no select inputs are active, gear 0 is selected. If \nmultiple select inputs are active the highest is selected.\n""";\n\nvariable float ngears;\nvariable gear_t gears[16];\n\nfunction _ fp;\nlicense "GPL";\noption extra_setup yes;\ninclude "hal/components/spindle.h";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:spindle:spindle",
        name: "spindle",
        halComponentName: "spindle",
        source: "comp",
        sourcePath: "src/hal/components/spindle.comp",
        docs: {
          component:
            "Control a spindle with different acceleration and deceleration and optional gear change scaling",
          description:
            "This component will control a spindle with adjustable acceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with names very much like those created by the motion component.\n In nearly every case this is not the documentation page that you are looking for.\n See http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate fwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and deceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with up to 16 gears.\nEach gear has individual control of speeds, acceleration, driver gain and direction.",
          seeAlso: "\\fBmotion\\fR(9)",
          notes:
            "\n.TP\n.B The following pins are created depending the 'numgears=' parameter.\nOne of each pin is created for each gear. If no gears are specified then one gear will be created.\nFor instance if you have gears=2 on your command line, you will have two scale pins:\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.0\\\\fP\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.1\\\\fP\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.\\\\fPx float in\nScale the output. For multiple gears you would use a different scale for each gear.\nIf you need to reverse the output for some gears, use a negative scale.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.min.\\\\fPx float in\nSet the minimum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is between 0 RPM and the min speed.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.max.\\\\fPx float in\nSet the maximum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is above this value.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.accel.\\\\fPx float in\nSet the maximum acceleration.\nIf you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed plus this value.\nThis way the acceleration can be dependent on the spindle load.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.decel.\\\\fPx float in\nSet the minimum deceleration. If you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed minus this value.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.speed-tolerance.\\\\fPx float in\nTolerance for 'at-speed' signal (in RPM).\nActual spindle speeds within this amount of the commanded speed will cause the at-speed signal to go TRUE.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.zero-tolerance.\\\\fPx float in\nTolerance for 'zero-speed' signal (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.offset.\\\\fPx float in\nThe output command is offset by this amount (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.select.\\\\fPx bit in\nSelects this gear. If no select inputs are active, gear 0 is selected.\nIf multiple select inputs are active then the highest is selected.\n",
          license: "GPL",
          author: "Les Newell",
        },
        pins: [
          {
            key: "select_gear",
            name: "select-gear",
            type: "u32",
            doc: "Select a gear. Must be in the range 0 -> number of available gears -1. If you use this, do not use the select.x input pins.",
            direction: "in",
          },
          {
            key: "commanded_speed",
            name: "commanded-speed",
            type: "float",
            doc: "Commanded spindle speed (in RPM)",
            direction: "in",
          },
          {
            key: "actual_speed",
            name: "actual-speed",
            type: "float",
            doc: "Actual spindle speed from a spindle encoder (in RPS).\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1.",
            direction: "in",
          },
          {
            key: "simulate_encoder",
            name: "simulate-encoder",
            type: "bit",
            doc: "If you do not have an encoder, set this to 1.",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, the spindle is stopped at the gear's maximum deceleration.",
            direction: "in",
          },
          {
            key: "spindle_lpf",
            name: "spindle-lpf",
            type: "float",
            doc: "Smooth the spindle-rpm-abs output when at speed, 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is.",
            direction: "in",
          },
          {
            key: "spindle_rpm",
            name: "spindle-rpm",
            type: "float",
            doc: "Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.",
            direction: "out",
          },
          {
            key: "spindle_rpm_abs",
            name: "spindle-rpm-abs",
            type: "float",
            doc: "Absolute spindle speed in RPM. Useful for spindle speed displays.",
            direction: "out",
          },
          {
            key: "output",
            name: "output",
            type: "float",
            doc: "Scaled output",
            direction: "out",
          },
          {
            key: "current_gear",
            name: "current-gear",
            type: "u32",
            doc: "Currently selected gear.",
            direction: "out",
          },
          {
            key: "at_speed",
            name: "at-speed",
            type: "bit",
            doc: "TRUE when the spindle is at speed",
            direction: "out",
          },
          {
            key: "forward",
            name: "forward",
            type: "bit",
            doc: "TRUE for forward rotation",
            direction: "out",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.",
            direction: "out",
          },
          {
            key: "brake",
            name: "brake",
            type: "bit",
            doc: "TRUE when decelerating",
            direction: "out",
          },
          {
            key: "zero_speed",
            name: "zero-speed",
            type: "bit",
            doc: "TRUE when the spindle is stationary",
            direction: "out",
          },
          {
            key: "limited",
            name: "limited",
            type: "bit",
            doc: "TRUE when the commanded spindle speed is >max or <min.",
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
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  spindle.comp\n*               Spindle HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*\n* Copyright (c) 2009 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111 USA\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the LinuxCNC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n\ncomponent spindle "Control a spindle with different acceleration and deceleration and optional gear change scaling";\n\ndescription """This component will control a spindle with adjustable acceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with names very much like those created by the motion component.\n In nearly every case this is not the documentation page that you are looking for.\n See http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate fwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and deceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with up to 16 gears.\nEach gear has individual control of speeds, acceleration, driver gain and direction.""";\n\nsee_also "\\\\fBmotion\\\\fR(9)";\n\npin in unsigned select-gear\n"""Select a gear. Must be in the range 0 -> number of available gears -1. If you use this, do not use the select.x input pins.""";\n\npin in float commanded-speed "Commanded spindle speed (in RPM)";\npin in float actual-speed """Actual spindle speed from a spindle encoder (in RPS).\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1.""";\npin in bit simulate-encoder "If you do not have an encoder, set this to 1.";\npin in bit enable "If FALSE, the spindle is stopped at the gear\'s maximum deceleration.";\npin in float spindle-lpf """Smooth the spindle-rpm-abs output when at speed, 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is.""";\n\npin out float spindle-rpm """Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.""";\n\npin out float spindle-rpm-abs "Absolute spindle speed in RPM. Useful for spindle speed displays.";\npin out float output "Scaled output";\npin out unsigned current-gear "Currently selected gear.";\n\npin out bit at-speed "TRUE when the spindle is at speed";\npin out bit forward "TRUE for forward rotation";\npin out bit reverse "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.";\npin out bit brake "TRUE when decelerating";\npin out bit zero-speed "TRUE when the spindle is stationary";\npin out bit limited """TRUE when the commanded spindle speed is >max or <min.""";\n\nnotes """\n.TP\n.B The following pins are created depending the \'numgears=\' parameter.\nOne of each pin is created for each gear. If no gears are specified then one gear will be created.\nFor instance if you have gears=2 on your command line, you will have two scale pins:\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.0\\\\fP\n \\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.1\\\\fP\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.scale.\\\\fPx float in\nScale the output. For multiple gears you would use a different scale for each gear.\nIf you need to reverse the output for some gears, use a negative scale.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.min.\\\\fPx float in\nSet the minimum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is between 0 RPM and the min speed.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.max.\\\\fPx float in\nSet the maximum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is above this value.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.accel.\\\\fPx float in\nSet the maximum acceleration.\nIf you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed plus this value.\nThis way the acceleration can be dependent on the spindle load.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.decel.\\\\fPx float in\nSet the minimum deceleration. If you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed minus this value.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.speed-tolerance.\\\\fPx float in\nTolerance for \'at-speed\' signal (in RPM).\nActual spindle speeds within this amount of the commanded speed will cause the at-speed signal to go TRUE.\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.zero-tolerance.\\\\fPx float in\nTolerance for \'zero-speed\' signal (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.offset.\\\\fPx float in\nThe output command is offset by this amount (in RPM).\n\n.TP\n\\\\fBspindle.\\\\fP\\\\fIN\\\\fB.select.\\\\fPx bit in\nSelects this gear. If no select inputs are active, gear 0 is selected.\nIf multiple select inputs are active then the highest is selected.\n""";\n\nvariable float ngears;\nvariable gear_t gears[16];\n\nfunction _ fp;\nlicense "GPL";\nauthor "Les Newell";\noption extra_setup yes;\ninclude "hal/components/spindle.h";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:spindle:spindle",
        name: "spindle",
        halComponentName: "spindle",
        source: "comp",
        sourcePath: "src/hal/components/spindle.comp",
        docs: {
          component:
            "Control a spindle with different acceleration and deceleration and optional gear change scaling",
          description:
            "This component will control a spindle with adjustable acceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with names very much like those created by the motion component.\n In nearly every case this is not the documentation page that you are looking for.\n See http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate fwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and deceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with up to 16 gears.\nEach gear has individual control of speeds, acceleration, driver gain and direction.",
          seeAlso: "*motion*(9)",
          notes:
            "\nThe following pins are created depending the 'numgears=' parameter.\nOne of each pin is created for each gear. If no gears are specified then one gear will be created.\nFor instance if you have gears=2 on your command line, you will have two scale pins: +\n*spindle*._N_.*scale*.*0* +\n*spindle*._N_.*scale*.*1*\n\n*spindle*._N_.*scale*.x float in::\nScale the output. For multiple gears you would use a different scale for each gear.\nIf you need to reverse the output for some gears, use a negative scale.\n\n*spindle*._N_.*min*.x float in::\nSet the minimum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is between 0 RPM and the min speed.\n\n*spindle*._N_.*max*.x float in::\nSet the maximum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is above this value.\n\n*spindle*._N_.*accel*.x float in::\nSet the maximum acceleration.\nIf you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed plus this value.\nThis way the acceleration can be dependent on the spindle load.\n\n*spindle*._N_.*decel*.x float in::\nSet the minimum deceleration. If you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed minus this value.\n\n*spindle*._N_.*speed-tolerance*.x float in::\nTolerance for 'at-speed' signal (in RPM).\nActual spindle speeds within this amount of the commanded speed will cause the at-speed signal to go TRUE.\n\n*spindle*._N_.*zero-tolerance*.x float in::\nTolerance for 'zero-speed' signal (in RPM).\n\n*spindle*._N_.*offset*.x float in::\nThe output command is offset by this amount (in RPM).\n\n*spindle*._N_.*select*.x bit in::\nSelects this gear. If no select inputs are active, gear 0 is selected.\nIf multiple select inputs are active then the highest is selected.\n",
          license: "GPL",
          author: "Les Newell",
        },
        pins: [
          {
            key: "select_gear",
            name: "select-gear",
            type: "u32",
            doc: "Select a gear. Must be in the range 0 -> number of available gears -1. If you use this, do not use the select.x input pins.",
            direction: "in",
          },
          {
            key: "commanded_speed",
            name: "commanded-speed",
            type: "float",
            doc: "Commanded spindle speed (in RPM)",
            direction: "in",
          },
          {
            key: "actual_speed",
            name: "actual-speed",
            type: "float",
            doc: "Actual spindle speed from a spindle encoder (in RPS).\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1.",
            direction: "in",
          },
          {
            key: "simulate_encoder",
            name: "simulate-encoder",
            type: "bit",
            doc: "If you do not have an encoder, set this to 1.",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If FALSE, the spindle is stopped at the gear's maximum deceleration.",
            direction: "in",
          },
          {
            key: "spindle_lpf",
            name: "spindle-lpf",
            type: "float",
            doc: "Smooth the spindle-rpm-abs output when at speed, 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is.",
            direction: "in",
          },
          {
            key: "spindle_rpm",
            name: "spindle-rpm",
            type: "float",
            doc: "Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.",
            direction: "out",
          },
          {
            key: "spindle_rpm_abs",
            name: "spindle-rpm-abs",
            type: "float",
            doc: "Absolute spindle speed in RPM. Useful for spindle speed displays.",
            direction: "out",
          },
          {
            key: "output",
            name: "output",
            type: "float",
            doc: "Scaled output",
            direction: "out",
          },
          {
            key: "current_gear",
            name: "current-gear",
            type: "u32",
            doc: "Currently selected gear.",
            direction: "out",
          },
          {
            key: "at_speed",
            name: "at-speed",
            type: "bit",
            doc: "TRUE when the spindle is at speed",
            direction: "out",
          },
          {
            key: "forward",
            name: "forward",
            type: "bit",
            doc: "TRUE for forward rotation",
            direction: "out",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.",
            direction: "out",
          },
          {
            key: "brake",
            name: "brake",
            type: "bit",
            doc: "TRUE when decelerating",
            direction: "out",
          },
          {
            key: "zero_speed",
            name: "zero-speed",
            type: "bit",
            doc: "TRUE when the spindle is stationary",
            direction: "out",
          },
          {
            key: "limited",
            name: "limited",
            type: "bit",
            doc: "TRUE when the commanded spindle speed is >max or <min.",
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
            extra_setup: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            '/********************************************************************\n* Description:  spindle.comp\n*               Spindle HAL component.\n*\n* Author: Les Newell <les at sheetcam dot com>\n* License: GPL Version 2 or later\n*\n* Copyright (c) 2009 All rights reserved.\n*\n********************************************************************\n *\n * This program is free software; you can redistribute it and/or\n * modify it under the terms of version 2 or later of the GNU General\n * Public License as published by the Free Software Foundation.\n * This library is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public\n * License along with this library; if not, write to the Free Software\n * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111 USA\n *\n * THE AUTHORS OF THIS LIBRARY ACCEPT ABSOLUTELY NO LIABILITY FOR\n * ANY HARM OR LOSS RESULTING FROM ITS USE.  IT IS _EXTREMELY_ UNWISE\n * TO RELY ON SOFTWARE ALONE FOR SAFETY.  Any machinery capable of\n * harming persons must have provisions for completely removing power\n * from all motors, etc, before persons enter any danger area.  All\n * machinery must be designed to comply with local and national safety\n * codes, and the authors of this software can not, and do not, take\n * any responsibility for such compliance.\n *\n * This code was written as part of the LinuxCNC HAL project.  For more\n * information, go to www.linuxcnc.org.\n *\n*************************************************************************/\n\ncomponent spindle "Control a spindle with different acceleration and deceleration and optional gear change scaling";\n\ndescription """This component will control a spindle with adjustable acceleration and deceleration.\n\n NOTE: This component is unfortunately named and creates pins with names very much like those created by the motion component.\n In nearly every case this is not the documentation page that you are looking for.\n See http://linuxcnc.org/docs/html/man/man9/motion.9.html instead.\n\nIt is designed for use with non-servo spindle drives that have separate fwd/reverse inputs, such as DC drives and inverters.\nIf a spindle encoder is available it is used to tailor the acceleration and deceleration to the spindle load.\nIf not the spindle speed is simulated. The component allows for gearboxes with up to 16 gears.\nEach gear has individual control of speeds, acceleration, driver gain and direction.""";\n\nsee_also "*motion*(9)";\n\npin in unsigned select-gear\n"""Select a gear. Must be in the range 0 -> number of available gears -1. If you use this, do not use the select.x input pins.""";\n\npin in float commanded-speed "Commanded spindle speed (in RPM)";\npin in float actual-speed """Actual spindle speed from a spindle encoder (in RPS).\nIf you do not have a spindle encoder set the simulate_encoder parameter to 1.""";\npin in bit simulate-encoder "If you do not have an encoder, set this to 1.";\npin in bit enable "If FALSE, the spindle is stopped at the gear\'s maximum deceleration.";\npin in float spindle-lpf """Smooth the spindle-rpm-abs output when at speed, 0 = disabled.\nSuitable values are probably between 1 and 20 depending on how stable your spindle is.""";\n\npin out float spindle-rpm """Current spindle speed in RPM.+ve = forward, -ve = reverse.\nUses the encoder input if available. If not, uses a simulated encoder speed.""";\n\npin out float spindle-rpm-abs "Absolute spindle speed in RPM. Useful for spindle speed displays.";\npin out float output "Scaled output";\npin out unsigned current-gear "Currently selected gear.";\n\npin out bit at-speed "TRUE when the spindle is at speed";\npin out bit forward "TRUE for forward rotation";\npin out bit reverse "TRUE for reverse rotation. Both forward and reverse are false when the spindle is stopped.";\npin out bit brake "TRUE when decelerating";\npin out bit zero-speed "TRUE when the spindle is stationary";\npin out bit limited """TRUE when the commanded spindle speed is >max or <min.""";\n\nnotes """\nThe following pins are created depending the \'numgears=\' parameter.\nOne of each pin is created for each gear. If no gears are specified then one gear will be created.\nFor instance if you have gears=2 on your command line, you will have two scale pins: +\n*spindle*._N_.*scale*.*0* +\n*spindle*._N_.*scale*.*1*\n\n*spindle*._N_.*scale*.x float in::\nScale the output. For multiple gears you would use a different scale for each gear.\nIf you need to reverse the output for some gears, use a negative scale.\n\n*spindle*._N_.*min*.x float in::\nSet the minimum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is between 0 RPM and the min speed.\n\n*spindle*._N_.*max*.x float in::\nSet the maximum speed allowed (in RPM).\nThe limit output will be TRUE while the commanded speed is above this value.\n\n*spindle*._N_.*accel*.x float in::\nSet the maximum acceleration.\nIf you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed plus this value.\nThis way the acceleration can be dependent on the spindle load.\n\n*spindle*._N_.*decel*.x float in::\nSet the minimum deceleration. If you do not have a spindle encoder this is in RPM/second.\nIf you do have an encoder the output is the actual speed minus this value.\n\n*spindle*._N_.*speed-tolerance*.x float in::\nTolerance for \'at-speed\' signal (in RPM).\nActual spindle speeds within this amount of the commanded speed will cause the at-speed signal to go TRUE.\n\n*spindle*._N_.*zero-tolerance*.x float in::\nTolerance for \'zero-speed\' signal (in RPM).\n\n*spindle*._N_.*offset*.x float in::\nThe output command is offset by this amount (in RPM).\n\n*spindle*._N_.*select*.x bit in::\nSelects this gear. If no select inputs are active, gear 0 is selected.\nIf multiple select inputs are active then the highest is selected.\n""";\n\nvariable float ngears;\nvariable gear_t gears[16];\n\nfunction _ fp;\nlicense "GPL";\nauthor "Les Newell";\noption extra_setup yes;\ninclude "hal/components/spindle.h";\n\n',
        },
      },
    },
  ],
};

export default history;
