import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "joint_axis_mapper",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:joint-axis-mapper:joint-axis-mapper",
        name: "joint_axis_mapper",
        halComponentName: "joint_axis_mapper",
        source: "comp",
        sourcePath: "src/hal/components/joint_axis_mapper.comp",
        docs: {
          component: "Translate faults from Joint to Axis",
          description:
            "\nBy default 'joint.n.amp-fault-in' triggers an error message 'Joint n amplifier fault'.\n\nThis component is a translation layer that shows an additional message\n'{L} Axis fault detected', with {L} being the axis letter associated with the faulted joint.\n\n\nUsage example:\nloadrt joint_axis_mapper coord=xyz\naddf   joint_axis_mapper servo-thread\n\nnet x-fault joint.0.faulted => jam.x-fault\nnet y-fault joint.1.faulted => jam.y-fault\nnet z-fault joint.2.faulted => jam.z-fault\n",
          license: "GPL",
        },
        pins: [
          {
            key: "dummy",
            name: "dummy",
            type: "bit",
            doc: "halcompile requires at least one halpin",
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
            singleton: true,
            rtapi_app: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component joint_axis_mapper "Translate faults from Joint to Axis";\n\ndescription """\nBy default \'joint.n.amp-fault-in\' triggers an error message \'Joint n amplifier fault\'.\n\nThis component is a translation layer that shows an additional message\n\'{L} Axis fault detected\', with {L} being the axis letter associated with the faulted joint.\n\n\nUsage example:\nloadrt joint_axis_mapper coord=xyz\naddf   joint_axis_mapper servo-thread\n\nnet x-fault joint.0.faulted => jam.x-fault\nnet y-fault joint.1.faulted => jam.y-fault\nnet z-fault joint.2.faulted => jam.z-fault\n""";\n\nlicense "GPL";\n\npin out bit dummy "halcompile requires at least one halpin";\n\nfunction _;\noption period no;\noption singleton yes;\noption rtapi_app no;\n\n',
        },
      },
    },
  ],
};

export default history;
