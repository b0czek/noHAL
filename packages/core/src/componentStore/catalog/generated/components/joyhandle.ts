import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "joyhandle",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:joyhandle:joyhandle",
        name: "joyhandle",
        halComponentName: "joyhandle",
        source: "comp",
        sourcePath: "src/hal/components/joyhandle.comp",
        docs: {
          component: "sets nonlinear joypad movements, deadbands and scales",
          description:
            "\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symetrically to origin. Values \\-deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < \\-1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\(hy5, take higher power\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "power",
            name: "power",
            type: "float",
            defaultValue: "2.0",
            direction: "rw",
          },
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1.",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "inverse",
            name: "inverse",
            type: "bit",
            defaultValue: "0",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Paul Willutzki <paul[at]willutzki[dot]de>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA\n\ncomponent joyhandle "sets nonlinear joypad movements, deadbands and scales";\npin in float in;\npin out float out;\nparam rw float power = 2.0;\nparam rw float deadband = 0.;\nparam rw float scale = 1.;\nparam rw float offset = 0.;\nparam rw bit inverse = 0;\t\n\ndescription """\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symetrically to origin. Values \\-deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < \\-1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\(hy5, take higher power\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n""";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:joyhandle:joyhandle",
        name: "joyhandle",
        halComponentName: "joyhandle",
        source: "comp",
        sourcePath: "src/hal/components/joyhandle.comp",
        docs: {
          component: "sets nonlinear joypad movements, deadbands and scales",
          description:
            "\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symetrically to origin. Values \\-deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < \\-1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\(hy5, take higher power\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "power",
            name: "power",
            type: "float",
            defaultValue: "2.0",
            direction: "rw",
          },
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1.",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "inverse",
            name: "inverse",
            type: "bit",
            defaultValue: "0",
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
            '//   This is a component for EMC2 HAL\n//   Copyright 2008 Paul Willutzki <paul[at]willutzki[dot]de>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent joyhandle "sets nonlinear joypad movements, deadbands and scales";\npin in float in;\npin out float out;\nparam rw float power = 2.0;\nparam rw float deadband = 0.;\nparam rw float scale = 1.;\nparam rw float offset = 0.;\nparam rw bit inverse = 0;\t\n\ndescription """\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symetrically to origin. Values \\-deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < \\-1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\(hy5, take higher power\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n""";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:joyhandle:joyhandle",
        name: "joyhandle",
        halComponentName: "joyhandle",
        source: "comp",
        sourcePath: "src/hal/components/joyhandle.comp",
        docs: {
          component: "sets nonlinear joypad movements, deadbands and scales",
          description:
            "\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symmetrically to origin. Values -deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < -1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\\\(hy5, take higher power\\\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n",
          license: "GPL",
          author: "Paul Willutzki",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "power",
            name: "power",
            type: "float",
            defaultValue: "2.0",
            direction: "rw",
          },
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1.",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "inverse",
            name: "inverse",
            type: "bit",
            defaultValue: "0",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Paul Willutzki <paul[at]willutzki[dot]de>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent joyhandle "sets nonlinear joypad movements, deadbands and scales";\npin in float in;\npin out float out;\nparam rw float power = 2.0;\nparam rw float deadband = 0.;\nparam rw float scale = 1.;\nparam rw float offset = 0.;\nparam rw bit inverse = 0;\t\n\ndescription """\nThe component \\\\fBjoyhandle\\\\fR uses the following formula for a non linear joypad movements:\n\n\\\\fBy = (scale * (a*x^power + b*x)) + offset\\\\fR\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symmetrically to origin. Values -deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < -1 will be skipped to \\\\(+-(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power >= 1.0 (reasonable values are 1.x .. 4\\\\(hy5, take higher power\\\\(hyvalues for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 <= deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n""";\n\nfunction _;\nlicense "GPL";\nauthor "Paul Willutzki";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:joyhandle:joyhandle",
        name: "joyhandle",
        halComponentName: "joyhandle",
        source: "comp",
        sourcePath: "src/hal/components/joyhandle.comp",
        docs: {
          component: "sets nonlinear joypad movements, deadbands and scales",
          description:
            "\nThe component *joyhandle* uses the following formula for a non linear joypad movements:\n\n  y = (scale * (a * x^power + b * x)) + offset\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symmetrically to origin. Values -deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < -1 will be skipped to ±(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power ≥ 1.0 (reasonable values are 1.x .. 4-5, take higher power-values for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 ≤ deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n",
          license: "GPL",
          author: "Paul Willutzki",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "power",
            name: "power",
            type: "float",
            defaultValue: "2.0",
            direction: "rw",
          },
          {
            key: "deadband",
            name: "deadband",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1.",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
            type: "float",
            defaultValue: "0.",
            direction: "rw",
          },
          {
            key: "inverse",
            name: "inverse",
            type: "bit",
            defaultValue: "0",
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
            '//   This is a component for LinuxCNC HAL\n//   Copyright 2008 Paul Willutzki <paul[at]willutzki[dot]de>\n//\n//   This program is free software; you can redistribute it and/or\n//   modify it under the terms of version 2 of the GNU General\n//   Public License as published by the Free Software Foundation.\n//\n//   This program is distributed in the hope that it will be useful,\n//   but WITHOUT ANY WARRANTY; without even the implied warranty of\n//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n//   GNU General Public License for more details.\n//\n//   You should have received a copy of the GNU General Public License\n//   along with this program; if not, write to the Free Software\n//   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.\n\ncomponent joyhandle "sets nonlinear joypad movements, deadbands and scales";\npin in float in;\npin out float out;\nparam rw float power = 2.0;\nparam rw float deadband = 0.;\nparam rw float scale = 1.;\nparam rw float offset = 0.;\nparam rw bit inverse = 0;\t\n\ndescription """\nThe component *joyhandle* uses the following formula for a non linear joypad movements:\n\n  y = (scale * (a * x^power + b * x)) + offset\n\nThe parameters a and b are adjusted in such a way, that the function starts at (deadband,offset) and ends at (1,scale+offset).\n\nNegative values will be treated point symmetrically to origin. Values -deadband < x < +deadband will be set to zero.\n\nValues x > 1 and x < -1 will be skipped to ±(scale+offset). Invert transforms the function to a progressive movement.\n\nWith power one can adjust the nonlinearity (default = 2). Default for deadband is 0.\n\nValid values are: power ≥ 1.0 (reasonable values are 1.x .. 4-5, take higher power-values for higher deadbands (>0.5), if you want to start with a nearly horizontal slope), 0 ≤ deadband < 0.99 (reasonable 0.1).\n\nAn additional offset component can be set in special cases (default = 0).\n\nAll values can be adjusted for each instance separately.\n""";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Paul Willutzki";\n',
        },
      },
    },
  ],
};

export default history;
