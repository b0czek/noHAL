import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "filter_kalman",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:filter-kalman:filter-kalman",
        name: "filter_kalman",
        halComponentName: "filter_kalman",
        source: "comp",
        sourcePath: "src/hal/components/filter_kalman.comp",
        docs: {
          component:
            "Unidimensional Kalman filter, also known as linear quadratic estimation (LQE)",
          license: "GPL-2.0-or-later",
          author: "Dmian Wrobel <dwrobel@ertelnet.rybnik.pl>",
          description:
            "\nUseful for reducing input signal noise (e.g. from the voltage or temperature sensor).\n\nMore information can be found at https://en.wikipedia.org/wiki/Kalman_filter.\n\nAdjusting \\\\fBQr\\\\fR and \\\\fBQk\\\\fR covariances:\n\nDefault values of \\\\fBRk\\\\fR and \\\\fBQk\\\\fR are given for informational purpose only. The nature of the\nfilter requires the parameters to be individually computed.\n\nOne of the possible and quite practical method (probably far from being the best) of\nestimating the \\\\fBRk\\\\fR covariance is to collect the raw data from the sensor by\neither asserting the \\\\fBdebug\\\\fR pin or using \\\\fBhalscope\\\\fR and then compute the covariance\nusing \\\\fBcov()\\\\fR function from \\\\fBOctave\\\\fR package. Ready to use script can be found at\nhttps://github.com/dwrobel/TrivialKalmanFilter/blob/master/examples/DS18B20Test/covariance.m.\n\nAdjusting \\\\fBQk\\\\fR covariance mostly depends on the required response time of the filter.\nThere is a relationship between \\\\fBQk\\\\fR and response time of the filter that the lower\nthe \\\\fBQk\\\\fR covariance is the slower the response of the filter is.\n\nCommon practice is also to conservatively set \\\\fBRk\\\\fR and \\\\fBQk\\\\fR slightly larger then computed\nones to get robustness.\n",
        },
        pins: [
          {
            key: "debug",
            name: "debug",
            type: "bit",
            doc: "When asserted, prints out measured and estimated values.",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "passthrough",
            name: "passthrough",
            type: "bit",
            doc: "When asserted, copies measured value into estimated value.",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When asserted, resets filter to its initial state and returns 0 as an estimated value (\\\\fBreset\\\\fR pin\nhas higher priority than \\\\fBpassthrough\\\\fR pin).",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "zk",
            name: "zk",
            type: "float",
            doc: "Measured value.",
            direction: "in",
          },
          {
            key: "xk_out",
            name: "xk-out",
            type: "float",
            doc: "Estimated value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "Rk",
            name: "Rk",
            type: "float",
            doc: "Estimation of the noise covariances (process).",
            defaultValue: "1.17549e-38",
            direction: "rw",
          },
          {
            key: "Qk",
            name: "Qk",
            type: "float",
            doc: "Estimation of the noise covariances (observation).",
            defaultValue: "1.17549e-38",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update \\fBxk-out\\fR based on \\fBzk\\fR input.",
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
            '//\n// Copyright (C) 2020  Damian Wrobel <dwrobel@ertelnet.rybnik.pl>\n//\n// This program is free software: you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation, either version 2 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program.  If not, see <https://www.gnu.org/licenses/>.\n//\n\ncomponent filter_kalman "Unidimensional Kalman filter, also known as linear quadratic estimation (LQE)";\nlicense "GPL-2.0-or-later";\nauthor "Dmian Wrobel <dwrobel@ertelnet.rybnik.pl>";\n\ndescription\n"""\nUseful for reducing input signal noise (e.g. from the voltage or temperature sensor).\n\nMore information can be found at https://en.wikipedia.org/wiki/Kalman_filter.\n\nAdjusting \\\\fBQr\\\\fR and \\\\fBQk\\\\fR covariances:\n\nDefault values of \\\\fBRk\\\\fR and \\\\fBQk\\\\fR are given for informational purpose only. The nature of the\nfilter requires the parameters to be individually computed.\n\nOne of the possible and quite practical method (probably far from being the best) of\nestimating the \\\\fBRk\\\\fR covariance is to collect the raw data from the sensor by\neither asserting the \\\\fBdebug\\\\fR pin or using \\\\fBhalscope\\\\fR and then compute the covariance\nusing \\\\fBcov()\\\\fR function from \\\\fBOctave\\\\fR package. Ready to use script can be found at\nhttps://github.com/dwrobel/TrivialKalmanFilter/blob/master/examples/DS18B20Test/covariance.m.\n\nAdjusting \\\\fBQk\\\\fR covariance mostly depends on the required response time of the filter.\nThere is a relationship between \\\\fBQk\\\\fR and response time of the filter that the lower\nthe \\\\fBQk\\\\fR covariance is the slower the response of the filter is.\n\nCommon practice is also to conservatively set \\\\fBRk\\\\fR and \\\\fBQk\\\\fR slightly larger then computed\nones to get robustness.\n""";\n\npin    in   bit  debug = FALSE             "When asserted, prints out measured and estimated values.";\npin    in   bit  passthrough = FALSE       "When asserted, copies measured value into estimated value.";\npin    in   bit  reset = FALSE\n"""When asserted, resets filter to its initial state and returns 0 as an estimated value (\\\\fBreset\\\\fR pin\nhas higher priority than \\\\fBpassthrough\\\\fR pin).""";\npin    in float     zk                     "Measured value.";\npin   out float xk_out                     "Estimated value.";\nparam  rw float     Rk = 1.17549e-38       "Estimation of the noise covariances (process).";\nparam  rw float     Qk = 1.17549e-38       "Estimation of the noise covariances (observation).";\n\noption extra_setup yes;\n\nfunction _ "Update \\\\fBxk-out\\\\fR based on \\\\fBzk\\\\fR input.";\n\nvariable float xk_last;\nvariable float Pk_last;\n\nvariable bool initialized = FALSE;\nvariable int cidx = 0;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:filter-kalman:filter-kalman",
        name: "filter_kalman",
        halComponentName: "filter_kalman",
        source: "comp",
        sourcePath: "src/hal/components/filter_kalman.comp",
        docs: {
          component:
            "Unidimensional Kalman filter, also known as linear quadratic estimation (LQE)",
          license: "GPL-2.0-or-later",
          author: "Dmian Wrobel dwrobel.AT.ertelnet.rybnik.pl",
          description:
            "\nUseful for reducing input signal noise (e.g. from the voltage or temperature sensor).\n\nMore information can be found at https://en.wikipedia.org/wiki/Kalman_filter.\n\nAdjusting *Qr* and *Qk* covariances:\n\nDefault values of *Rk* and *Qk* are given for informational purpose only. The nature of the\nfilter requires the parameters to be individually computed.\n\nOne of the possible and quite practical method (probably far from being the best) of\nestimating the *Rk* covariance is to collect the raw data from the sensor by\neither asserting the *debug* pin or using *halscope* and then compute the covariance\nusing *cov()* function from *Octave* package. Ready to use script can be found at\nhttps://github.com/dwrobel/TrivialKalmanFilter/blob/master/examples/DS18B20Test/covariance.m.\n\nAdjusting *Qk* covariance mostly depends on the required response time of the filter.\nThere is a relationship between *Qk* and response time of the filter that the lower\nthe *Qk* covariance is the slower the response of the filter is.\n\nCommon practice is also to conservatively set *Rk* and *Qk* slightly larger then computed\nones to get robustness.\n",
        },
        pins: [
          {
            key: "debug",
            name: "debug",
            type: "bit",
            doc: "When asserted, prints out measured and estimated values.",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "passthrough",
            name: "passthrough",
            type: "bit",
            doc: "When asserted, copies measured value into estimated value.",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When asserted, resets filter to its initial state and returns 0 as an estimated value (*reset* pin\nhas higher priority than *passthrough* pin).",
            defaultValue: "FALSE",
            direction: "in",
          },
          {
            key: "zk",
            name: "zk",
            type: "float",
            doc: "Measured value.",
            direction: "in",
          },
          {
            key: "xk_out",
            name: "xk-out",
            type: "float",
            doc: "Estimated value.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "Rk",
            name: "Rk",
            type: "float",
            doc: "Estimation of the noise covariances (process).",
            defaultValue: "1.17549e-38",
            direction: "rw",
          },
          {
            key: "Qk",
            name: "Qk",
            type: "float",
            doc: "Estimation of the noise covariances (observation).",
            defaultValue: "1.17549e-38",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Update *xk-out* based on *zk* input.",
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
            '//\n// Copyright (C) 2020  Damian Wrobel <dwrobel@ertelnet.rybnik.pl>\n//\n// This program is free software: you can redistribute it and/or modify\n// it under the terms of the GNU General Public License as published by\n// the Free Software Foundation, either version 2 of the License, or\n// (at your option) any later version.\n//\n// This program is distributed in the hope that it will be useful,\n// but WITHOUT ANY WARRANTY; without even the implied warranty of\n// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n// GNU General Public License for more details.\n//\n// You should have received a copy of the GNU General Public License\n// along with this program.  If not, see <https://www.gnu.org/licenses/>.\n//\n\ncomponent filter_kalman "Unidimensional Kalman filter, also known as linear quadratic estimation (LQE)";\nlicense "GPL-2.0-or-later";\nauthor "Dmian Wrobel dwrobel.AT.ertelnet.rybnik.pl";\n\ndescription\n"""\nUseful for reducing input signal noise (e.g. from the voltage or temperature sensor).\n\nMore information can be found at https://en.wikipedia.org/wiki/Kalman_filter.\n\nAdjusting *Qr* and *Qk* covariances:\n\nDefault values of *Rk* and *Qk* are given for informational purpose only. The nature of the\nfilter requires the parameters to be individually computed.\n\nOne of the possible and quite practical method (probably far from being the best) of\nestimating the *Rk* covariance is to collect the raw data from the sensor by\neither asserting the *debug* pin or using *halscope* and then compute the covariance\nusing *cov()* function from *Octave* package. Ready to use script can be found at\nhttps://github.com/dwrobel/TrivialKalmanFilter/blob/master/examples/DS18B20Test/covariance.m.\n\nAdjusting *Qk* covariance mostly depends on the required response time of the filter.\nThere is a relationship between *Qk* and response time of the filter that the lower\nthe *Qk* covariance is the slower the response of the filter is.\n\nCommon practice is also to conservatively set *Rk* and *Qk* slightly larger then computed\nones to get robustness.\n""";\n\npin    in   bit  debug = FALSE             "When asserted, prints out measured and estimated values.";\npin    in   bit  passthrough = FALSE       "When asserted, copies measured value into estimated value.";\npin    in   bit  reset = FALSE\n"""When asserted, resets filter to its initial state and returns 0 as an estimated value (*reset* pin\nhas higher priority than *passthrough* pin).""";\npin    in float     zk                     "Measured value.";\npin   out float xk_out                     "Estimated value.";\nparam  rw float     Rk = 1.17549e-38       "Estimation of the noise covariances (process).";\nparam  rw float     Qk = 1.17549e-38       "Estimation of the noise covariances (observation).";\n\noption extra_setup yes;\noption period no;\n\nfunction _ "Update *xk-out* based on *zk* input.";\n\nvariable float xk_last;\nvariable float Pk_last;\n\nvariable bool initialized = FALSE;\nvariable int cidx = 0;\n\n',
        },
      },
    },
  ],
};

export default history;
