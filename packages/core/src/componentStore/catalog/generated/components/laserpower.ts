import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "laserpower",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:laserpower:laserpower",
        name: "laserpower",
        halComponentName: "laserpower",
        source: "comp",
        sourcePath: "src/hal/components/laserpower.comp",
        docs: {
          component:
            "Scales laser power output based upon velocity input power and distance to go",
          description:
            "\nDuring operation laserpower must be scaled proportionally to actual velocity vs\ncommanded velocity. This prevents uneven laser power when rounding tight\ncorners.\n            \nComponent laserpower operates in 2 modes. Raster mode (when *raster_mode*=1).\nDuring raster mode *raster_power* is scaled between *min_power* and *max_power*\nproportionally to *req_velocity* and *cur_velocity*.\n\nVelocity mode (when *raster_mode*=0). During velocity mode *vector_power*\ncorresponds to the power level desired when reaching the next control point.\nThis allows vector power to be scaled along moves.\n",
          license: "GPL",
        },
        pins: [
          {
            key: "min_power",
            name: "min-power",
            type: "float",
            doc: "Minimum allowed power level. ",
            direction: "in",
          },
          {
            key: "max_power",
            name: "max-power",
            type: "float",
            doc: "Maximum allowed power level",
            direction: "in",
          },
          {
            key: "req_velocity",
            name: "req-velocity",
            type: "float",
            doc: "Requested motion velocity",
            direction: "in",
          },
          {
            key: "cur_velocity",
            name: "cur-velocity",
            type: "float",
            doc: "Current motion velocity",
            direction: "in",
          },
          {
            key: "enabled",
            name: "enabled",
            type: "bit",
            doc: "True when laser output enabled",
            direction: "in",
          },
          {
            key: "raster_mode",
            name: "raster-mode",
            type: "bit",
            doc: "false for vector mode, true for raster mode",
            direction: "in",
          },
          {
            key: "raster_power",
            name: "raster-power",
            type: "float",
            doc: "Requested power level during raster operations",
            direction: "in",
          },
          {
            key: "vector_power",
            name: "vector-power",
            type: "float",
            doc: "Requested power level during vector operations",
            direction: "in",
          },
          {
            key: "distance_to_go",
            name: "distance-to-go",
            type: "float",
            doc: "Distance to go of current move",
            direction: "in",
          },
          {
            key: "power",
            name: "power",
            type: "float",
            doc: "Current power level command",
            direction: "out",
          },
          {
            key: "command_power",
            name: "command-power",
            type: "float",
            doc: "Commanded power before normalization and velocity scaling",
            direction: "out",
          },
          {
            key: "start_power",
            name: "start-power",
            type: "float",
            doc: "Power level when reqPower last changed",
            direction: "out",
          },
          {
            key: "start_distance",
            name: "start-distance",
            type: "float",
            doc: "Distance amount when reqPower last changed",
            direction: "out",
          },
          {
            key: "vel_scale",
            name: "vel-scale",
            type: "float",
            doc: "Velocity related scaling component.",
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
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component laserpower "Scales laser power output based upon velocity input power and distance to go";\npin in float min_power "Minimum allowed power level. ";\npin in float max_power "Maximum allowed power level";\npin in float req_velocity "Requested motion velocity";\npin in float cur_velocity "Current motion velocity";\npin in bit enabled "True when laser output enabled";\n\npin in bit raster_mode "false for vector mode, true for raster mode";\npin in float raster_power "Requested power level during raster operations";\n\npin in float vector_power "Requested power level during vector operations";\npin in float distance_to_go "Distance to go of current move";\n\npin out float power "Current power level command";\n\npin out float command_power "Commanded power before normalization and velocity scaling";\npin out float start_power "Power level when reqPower last changed";\npin out float start_distance "Distance amount when reqPower last changed";\npin out float vel_scale "Velocity related scaling component.";\n\ndescription """\nDuring operation laserpower must be scaled proportionally to actual velocity vs\ncommanded velocity. This prevents uneven laser power when rounding tight\ncorners.\n            \nComponent laserpower operates in 2 modes. Raster mode (when *raster_mode*=1).\nDuring raster mode *raster_power* is scaled between *min_power* and *max_power*\nproportionally to *req_velocity* and *cur_velocity*.\n\nVelocity mode (when *raster_mode*=0). During velocity mode *vector_power*\ncorresponds to the power level desired when reaching the next control point.\nThis allows vector power to be scaled along moves.\n""";\n\noption period no;\nfunction _;\nlicense "GPL";\n\ninclude <rtapi_math.h>;\n\n',
        },
      },
    },
  ],
};

export default history;
