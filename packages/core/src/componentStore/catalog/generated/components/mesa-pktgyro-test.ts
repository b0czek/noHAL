import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "mesa_pktgyro_test",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:mesa-pktgyro-test:mesa-pktgyro-test",
        name: "mesa_pktgyro_test",
        halComponentName: "mesa_pktgyro_test",
        source: "comp",
        sourcePath: "src/hal/components/mesa_pktgyro_test.comp",
        docs: {
          component: "PktUART simple test with Microstrain 3DM-GX3-15 gyro",
          description:
            "This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh's mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n\\\\fB loadrt mesa_uart names=hm2_5i25.0.pktuart.0\\\\fR\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type \"dmesg\" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh's\nmesa_uart.comp\n\nIn order to compile and install do:\n\\\\fB halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\\\\fR\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\\\\fB loadrt hostmot2\\\\fR\n\\\\fB loadrt hm2_pci\\\\fR\n\\\\fB loadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\\\\fR\n\\\\fB loadrt threads name1=test1 period1=10000000\\\\fR\n\\\\fB addf hm2_5i25.0.pktuart.0.receive test1\\\\fR\n\\\\fB start\\\\fR\n\nCheck linuxcnc.log for debug output.\n\n",
          author: "Boris Skegin",
          license: "GPL",
        },
        pins: [
          {
            key: "rxbytes",
            name: "rxbytes",
            type: "s32",
            doc: "Number of Bytes received or negative Error code",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "receive",
            declaredName: "receive",
            halSuffix: "receive",
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
            'component mesa_pktgyro_test "PktUART simple test with Microstrain 3DM-GX3-15 gyro";\n\ndescription """This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh\'s mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n\\\\fB loadrt mesa_uart names=hm2_5i25.0.pktuart.0\\\\fR\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type "dmesg" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh\'s\nmesa_uart.comp\n\nIn order to compile and install do:\n\\\\fB halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\\\\fR\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\\\\fB loadrt hostmot2\\\\fR\n\\\\fB loadrt hm2_pci\\\\fR\n\\\\fB loadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\\\\fR\n\\\\fB loadrt threads name1=test1 period1=10000000\\\\fR\n\\\\fB addf hm2_5i25.0.pktuart.0.receive test1\\\\fR\n\\\\fB start\\\\fR\n\nCheck linuxcnc.log for debug output.\n\n""";\n\n\nauthor "Boris Skegin";\nlicense "GPL";\n\ninclude "hal/drivers/mesa-hostmot2/hostmot2.h";\n\n\npin out s32 rxbytes  "Number of Bytes received or negative Error code";\n\nvariable char *name; // PktUART name\n\noption extra_setup yes;\n\nfunction receive;\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:mesa-pktgyro-test:mesa-pktgyro-test",
        name: "mesa_pktgyro_test",
        halComponentName: "mesa_pktgyro_test",
        source: "comp",
        sourcePath: "src/hal/components/mesa_pktgyro_test.comp",
        docs: {
          component: "PktUART simple test with Microstrain 3DM-GX3-15 gyro",
          description:
            "This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh's mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n\\\\fB loadrt mesa_uart names=hm2_5i25.0.pktuart.0\\\\fR\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type \"dmesg\" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh's\nmesa_uart.comp\n\nIn order to compile and install do:\n\\\\fB halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\\\\fR\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\\\\fB loadrt hostmot2\\\\fR\n\\\\fB loadrt hm2_pci\\\\fR\n\\\\fB loadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\\\\fR\n\\\\fB loadrt threads name1=test1 period1=10000000\\\\fR\n\\\\fB addf hm2_5i25.0.pktuart.0.receive test1\\\\fR\n\\\\fB start\\\\fR\n\nCheck linuxcnc.log for debug output.\n\n",
          author: "Boris Skegin",
          license: "GPL",
        },
        pins: [
          {
            key: "rxbytes",
            name: "rxbytes",
            type: "s32",
            doc: "Number of Bytes received or negative Error code",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "receive",
            declaredName: "receive",
            halSuffix: "receive",
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
            'component mesa_pktgyro_test "PktUART simple test with Microstrain 3DM-GX3-15 gyro";\n\ndescription """This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh\'s mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n\\\\fB loadrt mesa_uart names=hm2_5i25.0.pktuart.0\\\\fR\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type "dmesg" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh\'s\nmesa_uart.comp\n\nIn order to compile and install do:\n\\\\fB halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\\\\fR\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\\\\fB loadrt hostmot2\\\\fR\n\\\\fB loadrt hm2_pci\\\\fR\n\\\\fB loadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\\\\fR\n\\\\fB loadrt threads name1=test1 period1=10000000\\\\fR\n\\\\fB addf hm2_5i25.0.pktuart.0.receive test1\\\\fR\n\\\\fB start\\\\fR\n\nCheck linuxcnc.log for debug output.\n\n""";\n\n\nauthor "Boris Skegin";\nlicense "GPL";\n\ninclude "hal/drivers/mesa-hostmot2/hostmot2-serial.h";\ninclude "hal/drivers/mesa-hostmot2/hostmot2.h";\n\n\npin out s32 rxbytes  "Number of Bytes received or negative Error code";\n\nvariable char *name; // PktUART name\n\noption extra_setup yes;\n\nfunction receive;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:mesa-pktgyro-test:mesa-pktgyro-test",
        name: "mesa_pktgyro_test",
        halComponentName: "mesa_pktgyro_test",
        source: "comp",
        sourcePath: "src/hal/components/mesa_pktgyro_test.comp",
        docs: {
          component: "PktUART simple test with Microstrain 3DM-GX3-15 gyro",
          description:
            "This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh's mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n[source,hal]\n----\nloadrt mesa_uart names=hm2_5i25.0.pktuart.0\n----\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type \"dmesg\" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh's\nmesa_uart.comp\n\nIn order to compile and install do:\n\n  halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\n[source,hal]\n----\nloadrt hostmot2\nloadrt hm2_pci\nloadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\nloadrt threads name1=test1 period1=10000000\naddf hm2_5i25.0.pktuart.0.receive test1\nstart\n----\n\nCheck linuxcnc.log for debug output.\n\n",
          author: "Boris Skegin",
          license: "GPL",
        },
        pins: [
          {
            key: "rxbytes",
            name: "rxbytes",
            type: "s32",
            doc: "Number of Bytes received or negative Error code",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "receive",
            declaredName: "receive",
            halSuffix: "receive",
            floatMode: "fp",
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
            'component mesa_pktgyro_test "PktUART simple test with Microstrain 3DM-GX3-15 gyro";\n\ndescription """This component is written in order to test\nthe PktUART driver for Mesa. It resembles partly Andy Pugh\'s mesa_uart.comp .\n\nThis module uses the names= mode of loadrt declaration to specify which PktUART\ninstances to enable. A check is included to ensure that the count= option is\nnot used instead.\nFor simplicity we test only one PktUART instance, therefore load the component\nlike this:\n\n[source,hal]\n----\nloadrt mesa_uart names=hm2_5i25.0.pktuart.0\n----\n\nThe PktUART instance names are printed to the dmesg buffer during the Hostmot2\nsetup sequence, one for each PktUART instance included in the bitfile loaded to\neach installed card during the Hostmot2 setup sequence. Type "dmesg" at the\nterminal prompt to view the output.\nIf you want to work with more than one PktUART instance, consult Andy Pugh\'s\nmesa_uart.comp\n\nIn order to compile and install do:\n\n  halcompile --install src/hal/drivers/mesa_pktgyro_test.comp\n\nThe component exports only one function, namely receive, which needs to be added\nto a realtime thread.\nTo test this component  set DEBUG=5 before and execute this HAL script:\n\n[source,hal]\n----\nloadrt hostmot2\nloadrt hm2_pci\nloadrt mesa_pktgyro_test names=hm2_5i25.0.pktuart.0\nloadrt threads name1=test1 period1=10000000\naddf hm2_5i25.0.pktuart.0.receive test1\nstart\n----\n\nCheck linuxcnc.log for debug output.\n\n""";\n\n\nauthor "Boris Skegin";\nlicense "GPL";\n\ninclude "hal/drivers/mesa-hostmot2/hostmot2-serial.h";\ninclude "hal/drivers/mesa-hostmot2/hostmot2.h";\n\n\npin out s32 rxbytes  "Number of Bytes received or negative Error code";\n\nvariable char *name; // PktUART name\n\noption extra_setup yes;\noption period no;\n\nfunction receive;\n\n',
        },
      },
    },
  ],
};

export default history;
