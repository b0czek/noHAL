import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "lincurve",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:lincurve:lincurve",
        name: "lincurve",
        halComponentName: "lincurve",
        source: "comp",
        sourcePath: "src/hal/components/lincurve.comp",
        docs: {
          component: "one-dimensional lookup table",
          description:
            'This component can be used to map any floating-point input to a\nfloating-point output. Typical uses would include linearisation of\nthermocouples, defining PID gains that vary with external factors or to\nsubstitute for any mathematical function where absolute accuracy is not\nrequired.\n\nThe component can be thought of as a 2-dimensional graph of points in (x,y)\nspace joined by straight lines. The input value is located on the x axis,\nfollowed up until it touches the line, and the output of the component is set\nto the corresponding y-value.\n\nThe (x,y) points are defined by the x-val-NN and y-val-NN parameters which need\nto be set in the HAL file using "setp" commands.\n\nThe maximum number if (x,y) points supported is 16.\n\nFor input values less than the x-val-00 breakpoint the y-val-00 is returned. \nFor x greater than the largest x-val-NN the yval corresponding to x-max is\nreturned (ie, no extrapolation is performed.)\n\nSample usage: loadrt lincurve count=3 personality=4,4,4 \nfor a set of three 4-element graphs.\n ',
          author: "Andy Pugh",
          license: "GPL",
        },
        pins: [
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
            key: "out_io",
            name: "out-io",
            type: "float",
            doc: "The output value, compatible with PID gains",
            direction: "io",
          },
        ],
        params: [
          {
            key: "x_val_idxidx",
            name: "x-val-##",
            type: "float",
            doc: "axis breakpoints",
            arrayLen: 16,
            arrayExpr: "personality",
            direction: "rw",
          },
          {
            key: "y_val_idxidx",
            name: "y-val-##",
            type: "float",
            doc: "output values to be interpolated",
            arrayLen: 16,
            arrayExpr: "personality",
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
            extra_setup: 1,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lincurve "one-dimensional lookup table";\ndescription """This component can be used to map any floating-point input to a\nfloating-point output. Typical uses would include linearisation of\nthermocouples, defining PID gains that vary with external factors or to\nsubstitute for any mathematical function where absolute accuracy is not\nrequired.\n\nThe component can be thought of as a 2-dimensional graph of points in (x,y)\nspace joined by straight lines. The input value is located on the x axis,\nfollowed up until it touches the line, and the output of the component is set\nto the corresponding y-value.\n\nThe (x,y) points are defined by the x-val-NN and y-val-NN parameters which need\nto be set in the HAL file using "setp" commands.\n\nThe maximum number if (x,y) points supported is 16.\n\nFor input values less than the x-val-00 breakpoint the y-val-00 is returned. \nFor x greater than the largest x-val-NN the yval corresponding to x-max is\nreturned (ie, no extrapolation is performed.)\n\nSample usage: loadrt lincurve count=3 personality=4,4,4 \nfor a set of three 4-element graphs.\n """;\n\nparam rw float x-val-##[16 : personality] "axis breakpoints";\nparam rw float y-val-##[16 : personality] "output values to be interpolated";\n\npin in float in_ "The input value";\npin out float out_ "The output value";\npin io float out-io "The output value, compatible with PID gains";\n\nvariable unsigned i = 0;\n\noption extra_setup 1;\n\nauthor "Andy Pugh";\nlicense "GPL";\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:lincurve:lincurve",
        name: "lincurve",
        halComponentName: "lincurve",
        source: "comp",
        sourcePath: "src/hal/components/lincurve.comp",
        docs: {
          component: "one-dimensional lookup table",
          description:
            'This component can be used to map any floating-point input to a\nfloating-point output. Typical uses would include linearisation of\nthermocouples, defining PID gains that vary with external factors or to\nsubstitute for any mathematical function where absolute accuracy is not\nrequired.\n\nThe component can be thought of as a 2-dimensional graph of points in (x,y)\nspace joined by straight lines. The input value is located on the x axis,\nfollowed up until it touches the line, and the output of the component is set\nto the corresponding y-value.\n\nThe (x,y) points are defined by the x-val-NN and y-val-NN parameters which need\nto be set in the HAL file using "setp" commands.\n\nThe maximum number if (x,y) points supported is 16.\n\nFor input values less than the x-val-00 breakpoint the y-val-00 is returned. \nFor x greater than the largest x-val-NN the yval corresponding to x-max is\nreturned (ie, no extrapolation is performed.)\n\nSample usage: loadrt lincurve count=3 personality=4,4,4 \nfor a set of three 4-element graphs.\n ',
          author: "Andy Pugh",
          license: "GPL",
        },
        pins: [
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
            key: "out_io",
            name: "out-io",
            type: "float",
            doc: "The output value, compatible with PID gains",
            direction: "io",
          },
        ],
        params: [
          {
            key: "x_val_idxidx",
            name: "x-val-##",
            type: "float",
            doc: "axis breakpoints",
            arrayLen: 16,
            arrayExpr: "personality",
            direction: "rw",
          },
          {
            key: "y_val_idxidx",
            name: "y-val-##",
            type: "float",
            doc: "output values to be interpolated",
            arrayLen: 16,
            arrayExpr: "personality",
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
            extra_setup: 1,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lincurve "one-dimensional lookup table";\ndescription """This component can be used to map any floating-point input to a\nfloating-point output. Typical uses would include linearisation of\nthermocouples, defining PID gains that vary with external factors or to\nsubstitute for any mathematical function where absolute accuracy is not\nrequired.\n\nThe component can be thought of as a 2-dimensional graph of points in (x,y)\nspace joined by straight lines. The input value is located on the x axis,\nfollowed up until it touches the line, and the output of the component is set\nto the corresponding y-value.\n\nThe (x,y) points are defined by the x-val-NN and y-val-NN parameters which need\nto be set in the HAL file using "setp" commands.\n\nThe maximum number if (x,y) points supported is 16.\n\nFor input values less than the x-val-00 breakpoint the y-val-00 is returned. \nFor x greater than the largest x-val-NN the yval corresponding to x-max is\nreturned (ie, no extrapolation is performed.)\n\nSample usage: loadrt lincurve count=3 personality=4,4,4 \nfor a set of three 4-element graphs.\n """;\n\nparam rw float x-val-##[16 : personality] "axis breakpoints";\nparam rw float y-val-##[16 : personality] "output values to be interpolated";\n\npin in float in_ "The input value";\npin out float out_ "The output value";\npin io float out-io "The output value, compatible with PID gains";\n\nvariable unsigned i = 0;\n\noption extra_setup 1;\noption period no;\n\nauthor "Andy Pugh";\nlicense "GPL";\n\nfunction _;\n\n',
        },
      },
    },
  ],
};

export default history;
