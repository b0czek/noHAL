import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "estop_latch",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:estop-latch:estop-latch",
        name: "estop_latch",
        halComponentName: "estop_latch",
        source: "comp",
        sourcePath: "src/hal/components/estop_latch.comp",
        docs: {
          component: "Software ESTOP latch",
          description:
            '\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the\n.B out-ok\noutput is false,\nthe\n.B fault-out\noutput is true, and the\n.B watchdog\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when\n.B all\nthese conditions are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis false\n.IP \\\\(bu\n.B ok-in\nis true\n.IP \\\\(bu\n.B reset\nchanges from false to true\n.RE\n\nWhen "OK", the\n.B out-ok\noutput is true, the\n.B fault-out\noutput is false, and the\n.B watchdog\noutput is toggling.\n\nThe state changes from "OK" to "Faulted" when\n.B any\nof the following are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis true\n.IP \\\\(bu\n.B ok-in\nis false\n.RE\n\nTo facilitate using only a single fault source,\n.B ok-in\nand\n.B fault-en\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to \\\\fBfault-in\\\\fR,\n\\\\fBiocontrol.0.user-request-enable\\\\fR is connected to \\\\fBreset\\\\fR,\nand \\\\fBok-out\\\\fR is connected to \\\\fBiocontrol.0.emc-enable-in\\\\fB.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n',
          license: "GPL",
        },
        pins: [
          {
            key: "ok_in",
            name: "ok-in",
            type: "bit",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "fault_in",
            name: "fault-in",
            type: "bit",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "ok_out",
            name: "ok-out",
            type: "bit",
            defaultValue: "false",
            direction: "out",
          },
          {
            key: "fault_out",
            name: "fault-out",
            type: "bit",
            defaultValue: "true",
            direction: "out",
          },
          {
            key: "watchdog",
            name: "watchdog",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "estop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component estop_latch "Software ESTOP latch";\n\ndescription """\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the\n.B out-ok\noutput is false,\nthe\n.B fault-out\noutput is true, and the\n.B watchdog\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when\n.B all\nthese conditions are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis false\n.IP \\\\(bu\n.B ok-in\nis true\n.IP \\\\(bu\n.B reset\nchanges from false to true\n.RE\n\nWhen "OK", the\n.B out-ok\noutput is true, the\n.B fault-out\noutput is false, and the\n.B watchdog\noutput is toggling.\n\nThe state changes from "OK" to "Faulted" when\n.B any\nof the following are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis true\n.IP \\\\(bu\n.B ok-in\nis false\n.RE\n\nTo facilitate using only a single fault source,\n.B ok-in\nand\n.B fault-en\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to \\\\fBfault-in\\\\fR,\n\\\\fBiocontrol.0.user-request-enable\\\\fR is connected to \\\\fBreset\\\\fR,\nand \\\\fBok-out\\\\fR is connected to \\\\fBiocontrol.0.emc-enable-in\\\\fB.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n""";\n\npin in bit ok_in = true;\npin in bit fault_in = false;\npin in bit reset;\npin out bit ok_out = false;\npin out bit fault_out = true;\npin out bit watchdog;\nfunction _ nofp;\noption data estop_data;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:estop-latch:estop-latch",
        name: "estop_latch",
        halComponentName: "estop_latch",
        source: "comp",
        sourcePath: "src/hal/components/estop_latch.comp",
        docs: {
          component: "Software ESTOP latch",
          description:
            '\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the\n.B out-ok\noutput is false,\nthe\n.B fault-out\noutput is true, and the\n.B watchdog\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when\n.B all\nthese conditions are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis false\n.IP \\\\(bu\n.B ok-in\nis true\n.IP \\\\(bu\n.B reset\nchanges from false to true\n.RE\n\nWhen "OK", the\n.B out-ok\noutput is true, the\n.B fault-out\noutput is false, and the\n.B watchdog\noutput is toggling.\n\nThe state changes from "OK" to "Faulted" when\n.B any\nof the following are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis true\n.IP \\\\(bu\n.B ok-in\nis false\n.RE\n\nTo facilitate using only a single fault source,\n.B ok-in\nand\n.B fault-en\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to \\\\fBfault-in\\\\fR,\n\\\\fBiocontrol.0.user-request-enable\\\\fR is connected to \\\\fBreset\\\\fR,\nand \\\\fBok-out\\\\fR is connected to \\\\fBiocontrol.0.emc-enable-in\\\\fB.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n',
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "ok_in",
            name: "ok-in",
            type: "bit",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "fault_in",
            name: "fault-in",
            type: "bit",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "ok_out",
            name: "ok-out",
            type: "bit",
            defaultValue: "false",
            direction: "out",
          },
          {
            key: "fault_out",
            name: "fault-out",
            type: "bit",
            defaultValue: "true",
            direction: "out",
          },
          {
            key: "watchdog",
            name: "watchdog",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            data: "estop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component estop_latch "Software ESTOP latch";\n\ndescription """\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the\n.B out-ok\noutput is false,\nthe\n.B fault-out\noutput is true, and the\n.B watchdog\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when\n.B all\nthese conditions are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis false\n.IP \\\\(bu\n.B ok-in\nis true\n.IP \\\\(bu\n.B reset\nchanges from false to true\n.RE\n\nWhen "OK", the\n.B out-ok\noutput is true, the\n.B fault-out\noutput is false, and the\n.B watchdog\noutput is toggling.\n\nThe state changes from "OK" to "Faulted" when\n.B any\nof the following are true:\n.RS\n.IP \\\\(bu\n.B fault-in\nis true\n.IP \\\\(bu\n.B ok-in\nis false\n.RE\n\nTo facilitate using only a single fault source,\n.B ok-in\nand\n.B fault-en\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to \\\\fBfault-in\\\\fR,\n\\\\fBiocontrol.0.user-request-enable\\\\fR is connected to \\\\fBreset\\\\fR,\nand \\\\fBok-out\\\\fR is connected to \\\\fBiocontrol.0.emc-enable-in\\\\fB.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n""";\n\npin in bit ok_in = true;\npin in bit fault_in = false;\npin in bit reset;\npin out bit ok_out = false;\npin out bit fault_out = true;\npin out bit watchdog;\nfunction _ nofp;\noption data estop_data;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:estop-latch:estop-latch",
        name: "estop_latch",
        halComponentName: "estop_latch",
        source: "comp",
        sourcePath: "src/hal/components/estop_latch.comp",
        docs: {
          component: "Software ESTOP latch",
          description:
            '\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the *out-ok*\noutput is false, the *fault-out* output is true, and the *watchdog*\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when *all* these conditions are true:\n\n* *fault-in* is false\n* *ok-in* is true\n* *reset* changes from false to true\n\nWhen "OK", the *out-ok* output is true, the *fault-out* output is false, and\nthe *watchdog* output is toggling.\n\nThe state changes from "OK" to "Faulted" when *any* of the following are true:\n\n* *fault-in* is true\n* *ok-in* is false\n\nTo facilitate using only a single fault source, *ok-in* and *fault-en*\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to *fault-in*,\n*iocontrol.0.user-request-enable* is connected to *reset*,\nand *ok-out* is connected to *iocontrol.0.emc-enable-in*.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n',
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "ok_in",
            name: "ok-in",
            type: "bit",
            defaultValue: "true",
            direction: "in",
          },
          {
            key: "fault_in",
            name: "fault-in",
            type: "bit",
            defaultValue: "false",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "ok_out",
            name: "ok-out",
            type: "bit",
            defaultValue: "false",
            direction: "out",
          },
          {
            key: "fault_out",
            name: "fault-out",
            type: "bit",
            defaultValue: "true",
            direction: "out",
          },
          {
            key: "watchdog",
            name: "watchdog",
            type: "bit",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            period: false,
            data: "estop_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component estop_latch "Software ESTOP latch";\n\ndescription """\nThis component can be used as a part of a simple software ESTOP chain.\n\nIt has two states: "OK" and "Faulted".\n\nThe initial state is "Faulted".  When faulted, the *out-ok*\noutput is false, the *fault-out* output is true, and the *watchdog*\noutput is unchanging.\n\nThe state changes from "Faulted" to "OK" when *all* these conditions are true:\n\n* *fault-in* is false\n* *ok-in* is true\n* *reset* changes from false to true\n\nWhen "OK", the *out-ok* output is true, the *fault-out* output is false, and\nthe *watchdog* output is toggling.\n\nThe state changes from "OK" to "Faulted" when *any* of the following are true:\n\n* *fault-in* is true\n* *ok-in* is false\n\nTo facilitate using only a single fault source, *ok-in* and *fault-en*\nare both set to the non-fault-causing value when no signal is connected.\nFor estop-latch to ever be able to signal a fault, at least one of these\ninputs must be connected.\n\nTypically, an external fault or estop input is connected to *fault-in*,\n*iocontrol.0.user-request-enable* is connected to *reset*,\nand *ok-out* is connected to *iocontrol.0.emc-enable-in*.\n\nIn more complex systems, it may be more appropriate to use classicladder to\nmanage the software portion of the estop chain.\n""";\n\npin in bit ok_in = true;\npin in bit fault_in = false;\npin in bit reset;\npin out bit ok_out = false;\npin out bit fault_out = true;\npin out bit watchdog;\noption period no;\nfunction _ nofp;\noption data estop_data;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
