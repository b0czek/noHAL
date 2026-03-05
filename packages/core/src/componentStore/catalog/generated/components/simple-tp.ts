import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "simple_tp",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:simple-tp:simple-tp",
        name: "simple_tp",
        halComponentName: "simple_tp",
        source: "comp",
        sourcePath: "src/hal/components/simple_tp.comp",
        docs: {
          component:
            "\\\nThis component is a single axis simple trajectory planner, same as used for jogging in linuxcnc.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.",
          license: "GPL",
        },
        pins: [
          {
            key: "target_pos",
            name: "target-pos",
            type: "float",
            doc: "target position to plan for.",
            direction: "in",
          },
          {
            key: "maxvel",
            name: "maxvel",
            type: "float",
            doc: "Maximum velocity",
            direction: "in",
          },
          {
            key: "maxaccel",
            name: "maxaccel",
            type: "float",
            doc: "Acceleration rate",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If disabled, planner sets velocity to zero immedately.",
            direction: "in",
          },
          {
            key: "current_pos",
            name: "current-pos",
            type: "float",
            doc: "position commanded at this point in time.",
            direction: "out",
          },
          {
            key: "current_vel",
            name: "current-vel",
            type: "float",
            doc: "velocity commanded at this moment in time.",
            direction: "out",
          },
          {
            key: "active",
            name: "active",
            type: "bit",
            doc: "if active is true, the planner is requesting movement.",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update",
            declaredName: "update",
            halSuffix: "update",
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
            '//   This is a \'single axis trajectory planner\' component for linuxcnc\'s HAL\n//   This is a conversion of linuxcnc\'s internal jogging planner to comp\n//   see motion/simple_tp.c Author: jmkasunich\n//   Copyright 2014 Chris Morley <chrisinnanaimo@hotmail.com>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent simple_tp """\\\nThis component is a single axis simple trajectory planner, same as used for jogging in linuxcnc.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.""";\n\npin in float target-pos "target position to plan for.";\npin in float maxvel "Maximum velocity";\npin in float maxaccel "Acceleration rate";\npin in bit enable "If disabled, planner sets velocity to zero immedately.";\n\npin out float current-pos "position commanded at this point in time.";\npin out float current-vel "velocity commanded at this moment in time.";\npin out bit active "if active is true, the planner is requesting movement.";\nfunction update;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:simple-tp:simple-tp",
        name: "simple_tp",
        halComponentName: "simple_tp",
        source: "comp",
        sourcePath: "src/hal/components/simple_tp.comp",
        docs: {
          component:
            "\\\nThis component is a single axis simple trajectory planner, same as used for jogging in linuxcnc.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.",
          license: "GPL",
        },
        pins: [
          {
            key: "target_pos",
            name: "target-pos",
            type: "float",
            doc: "target position to plan for.",
            direction: "in",
          },
          {
            key: "maxvel",
            name: "maxvel",
            type: "float",
            doc: "Maximum velocity",
            direction: "in",
          },
          {
            key: "maxaccel",
            name: "maxaccel",
            type: "float",
            doc: "Acceleration rate",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If disabled, planner sets velocity to zero immediately.",
            direction: "in",
          },
          {
            key: "current_pos",
            name: "current-pos",
            type: "float",
            doc: "position commanded at this point in time.",
            direction: "out",
          },
          {
            key: "current_vel",
            name: "current-vel",
            type: "float",
            doc: "velocity commanded at this moment in time.",
            direction: "out",
          },
          {
            key: "active",
            name: "active",
            type: "bit",
            doc: "if active is true, the planner is requesting movement.",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update",
            declaredName: "update",
            halSuffix: "update",
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
            '//   This is a \'single axis trajectory planner\' component for linuxcnc\'s HAL\n//   This is a conversion of linuxcnc\'s internal jogging planner to comp\n//   see motion/simple_tp.c Author: jmkasunich\n//   Copyright 2014 Chris Morley <chrisinnanaimo@hotmail.com>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent simple_tp """\\\nThis component is a single axis simple trajectory planner, same as used for jogging in linuxcnc.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.""";\n\npin in float target-pos "target position to plan for.";\npin in float maxvel "Maximum velocity";\npin in float maxaccel "Acceleration rate";\npin in bit enable "If disabled, planner sets velocity to zero immediately.";\n\npin out float current-pos "position commanded at this point in time.";\npin out float current-vel "velocity commanded at this moment in time.";\npin out bit active "if active is true, the planner is requesting movement.";\nfunction update;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:simple-tp:simple-tp",
        name: "simple_tp",
        halComponentName: "simple_tp",
        source: "comp",
        sourcePath: "src/hal/components/simple_tp.comp",
        docs: {
          component:
            "\\\nThis component is a single axis simple trajectory planner, same as used for jogging in LinuxCNC.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.",
          license: "GPL",
          author: "Chris S Morley",
        },
        pins: [
          {
            key: "target_pos",
            name: "target-pos",
            type: "float",
            doc: "target position to plan for.",
            direction: "in",
          },
          {
            key: "maxvel",
            name: "maxvel",
            type: "float",
            doc: "Maximum velocity",
            direction: "in",
          },
          {
            key: "maxaccel",
            name: "maxaccel",
            type: "float",
            doc: "Acceleration rate",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "If disabled, planner sets velocity to zero immediately.",
            direction: "in",
          },
          {
            key: "current_pos",
            name: "current-pos",
            type: "float",
            doc: "position commanded at this point in time.",
            direction: "out",
          },
          {
            key: "current_vel",
            name: "current-vel",
            type: "float",
            doc: "velocity commanded at this moment in time.",
            direction: "out",
          },
          {
            key: "active",
            name: "active",
            type: "bit",
            doc: "if active is true, the planner is requesting movement.",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "update",
            declaredName: "update",
            halSuffix: "update",
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
            '//   This is a \'single axis trajectory planner\' component for linuxcnc\'s HAL\n//   This is a conversion of linuxcnc\'s internal jogging planner to comp\n//   see motion/simple_tp.c Author: jmkasunich\n//   Copyright 2014 Chris Morley <chrisinnanaimo@hotmail.com>\n//\n//   This program is free software; you can redistribute it and/or modify\n//   it under the terms of the GNU General Public License as published by\n//   the Free Software Foundation; either version 2 of the License, or\n//   (at your option) any later version.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent simple_tp """\\\nThis component is a single axis simple trajectory planner, same as used for jogging in LinuxCNC.\nUsed by PNCconf to allow testing of acceleration and velocity values for an axis.""";\n\npin in float target-pos "target position to plan for.";\npin in float maxvel "Maximum velocity";\npin in float maxaccel "Acceleration rate";\npin in bit enable "If disabled, planner sets velocity to zero immediately.";\n\npin out float current-pos "position commanded at this point in time.";\npin out float current-vel "velocity commanded at this moment in time.";\npin out bit active "if active is true, the planner is requesting movement.";\nfunction update;\nlicense "GPL";\nauthor "Chris S Morley";\n',
        },
      },
    },
  ],
};

export default history;
