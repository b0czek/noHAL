import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "max31855",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:max31855:max31855",
        name: "max31855",
        halComponentName: "max31855",
        source: "comp",
        sourcePath: "src/hal/components/max31855.comp",
        docs: {
          component:
            "Support for the MAX31855 Thermocouple-to-Digital converter using bitbanged spi",
          description:
            "The component requires at least 3 pins to bitbang spi protocol, for example:\n\n\\\\fB loadrt max31855 personality=1\\\\fR\n\n\\\\fB setp hm2_6i25.0.gpio.023.is_output true\\\\fR\n\\\\fB setp hm2_6i25.0.gpio.024.is_output true\\\\fR\n\n\\\\fB net spi.clk.in    hm2_6i25.0.gpio.023.out     max31855.0.clk.out\\\\fR\n\\\\fB net spi.cs.in     hm2_6i25.0.gpio.024.out     max31855.0.cs.out\\\\fR\n\\\\fB net spi.data0.in  hm2_6i25.0.gpio.033.in_not  max31855.0.data.0.in\\\\fR\n\n\\\\fB addf max31855.0.bitbang-spi servo-thread \\\\fR\n\n\nThe MAX31855 supports a range of -270C to 1800C, however linearization data \nis only available for the -200C to 1350C range, beyond which raw temperature is returned.\n\nTemperature pins are provided for readings in Celsius, Fahrenheit and Kelvin,\ntemperature values are not updated while a fault condition is present.\n\nThe personality parameter is used to indicate the number of sensors.\nMultiple sensors share the clk and cs pins, but connect to discrete data input pins.\nA maximum of 15 sensors are supported.\n\n",
          license: "GPL",
          author: "Joseph Calderon",
        },
        pins: [
          {
            key: "data_idx_in",
            name: "data.#.in",
            type: "bit",
            doc: "Pin(s) connected to data out.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "in",
          },
          {
            key: "cs_out",
            name: "cs.out",
            type: "bit",
            doc: "Pin connected to cs, pulled low to shift data, pulled high for data refresh.",
            direction: "out",
          },
          {
            key: "clk_out",
            name: "clk.out",
            type: "bit",
            doc: "Pin connected to clk.",
            direction: "out",
          },
          {
            key: "temp_celsius_idx",
            name: "temp-celsius.#",
            type: "float",
            doc: "Temperature output values in Celsius.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "temp_fahrenheit_idx",
            name: "temp-fahrenheit.#",
            type: "float",
            doc: "Temperature in Fahrenheit.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "temp_kelvin_idx",
            name: "temp-kelvin.#",
            type: "float",
            doc: "Temperature in Kelvin.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "fault_idx",
            name: "fault.#",
            type: "bit",
            doc: "Fault condition detected.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "fault_flags_idx",
            name: "fault-flags.#",
            type: "u32",
            doc: "Fault flags: 0x1  = open sensor, 0x2 short to gnd, 0x3 short to vcc.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "bitbang_spi",
            declaredName: "bitbang_spi",
            halSuffix: "bitbang-spi",
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
            'component max31855 "Support for the MAX31855 Thermocouple-to-Digital converter using bitbanged spi";\n\ndescription """The component requires at least 3 pins to bitbang spi protocol, for example:\n\n\\\\fB loadrt max31855 personality=1\\\\fR\n\n\\\\fB setp hm2_6i25.0.gpio.023.is_output true\\\\fR\n\\\\fB setp hm2_6i25.0.gpio.024.is_output true\\\\fR\n\n\\\\fB net spi.clk.in    hm2_6i25.0.gpio.023.out     max31855.0.clk.out\\\\fR\n\\\\fB net spi.cs.in     hm2_6i25.0.gpio.024.out     max31855.0.cs.out\\\\fR\n\\\\fB net spi.data0.in  hm2_6i25.0.gpio.033.in_not  max31855.0.data.0.in\\\\fR\n\n\\\\fB addf max31855.0.bitbang-spi servo-thread \\\\fR\n\n\nThe MAX31855 supports a range of -270C to 1800C, however linearization data \nis only available for the -200C to 1350C range, beyond which raw temperature is returned.\n\nTemperature pins are provided for readings in Celsius, Fahrenheit and Kelvin,\ntemperature values are not updated while a fault condition is present.\n\nThe personality parameter is used to indicate the number of sensors.\nMultiple sensors share the clk and cs pins, but connect to discrete data input pins.\nA maximum of 15 sensors are supported.\n\n""";\n\npin in  bit data.#.in [15 : (personality & 0xf)]  "Pin(s) connected to data out.";\npin out bit cs.out         "Pin connected to cs, pulled low to shift data, pulled high for data refresh.";\npin out bit clk.out        "Pin connected to clk.";\n\npin out float temp_celsius.# [15 : (personality & 0xf)] """Temperature output values in Celsius.""";\npin out float temp_fahrenheit.# [15 : (personality & 0xf)] """Temperature in Fahrenheit.""";\npin out float temp_kelvin.# [15 : (personality & 0xf)] """Temperature in Kelvin.""";\n\npin out bit fault.# [15 : (personality & 0xf)]  "Fault condition detected.";\npin out unsigned fault_flags.# [15 : (personality & 0xf)]  "Fault flags: 0x1  = open sensor, 0x2 short to gnd, 0x3 short to vcc.";\n\nvariable unsigned data_frame [15];\nvariable unsigned state = 1;\n\nfunction bitbang_spi fp;\nlicense "GPL";\nauthor "Joseph Calderon";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:max31855:max31855",
        name: "max31855",
        halComponentName: "max31855",
        source: "comp",
        sourcePath: "src/hal/components/max31855.comp",
        docs: {
          component:
            "Support for the MAX31855 Thermocouple-to-Digital converter using bitbanged spi",
          description:
            "The component requires at least 3 pins to bitbang spi protocol, for example:\n\n[source,hal]\n----\nloadrt max31855 personality=1\n\nsetp hm2_6i25.0.gpio.023.is_output true\nsetp hm2_6i25.0.gpio.024.is_output true\n\nnet spi.clk.in    hm2_6i25.0.gpio.023.out     max31855.0.clk.out\nnet spi.cs.in     hm2_6i25.0.gpio.024.out     max31855.0.cs.out\nnet spi.data0.in  hm2_6i25.0.gpio.033.in_not  max31855.0.data.0.in\n\naddf max31855.0.bitbang-spi servo-thread\n----\n\nThe MAX31855 supports a range of -270C to 1800C, however linearization data \nis only available for the -200C to 1350C range, beyond which raw temperature is returned.\n\nTemperature pins are provided for readings in Celsius, Fahrenheit and Kelvin,\ntemperature values are not updated while a fault condition is present.\n\nThe personality parameter is used to indicate the number of sensors.\nMultiple sensors share the clk and cs pins, but connect to discrete data input pins.\nA maximum of 15 sensors are supported.\n\n",
          license: "GPL",
          author: "Joseph Calderon",
        },
        pins: [
          {
            key: "data_idx_in",
            name: "data.#.in",
            type: "bit",
            doc: "Pin(s) connected to data out.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "in",
          },
          {
            key: "cs_out",
            name: "cs.out",
            type: "bit",
            doc: "Pin connected to cs, pulled low to shift data, pulled high for data refresh.",
            direction: "out",
          },
          {
            key: "clk_out",
            name: "clk.out",
            type: "bit",
            doc: "Pin connected to clk.",
            direction: "out",
          },
          {
            key: "temp_celsius_idx",
            name: "temp-celsius.#",
            type: "float",
            doc: "Temperature output values in Celsius.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "temp_fahrenheit_idx",
            name: "temp-fahrenheit.#",
            type: "float",
            doc: "Temperature in Fahrenheit.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "temp_kelvin_idx",
            name: "temp-kelvin.#",
            type: "float",
            doc: "Temperature in Kelvin.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "fault_idx",
            name: "fault.#",
            type: "bit",
            doc: "Fault condition detected.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
          {
            key: "fault_flags_idx",
            name: "fault-flags.#",
            type: "u32",
            doc: "Fault flags: 0x1  = open sensor, 0x2 short to gnd, 0x3 short to vcc.",
            arrayLen: 15,
            arrayExpr: "(personality & 0xf)",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "bitbang_spi",
            declaredName: "bitbang_spi",
            halSuffix: "bitbang-spi",
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
            'component max31855 "Support for the MAX31855 Thermocouple-to-Digital converter using bitbanged spi";\n\ndescription """The component requires at least 3 pins to bitbang spi protocol, for example:\n\n[source,hal]\n----\nloadrt max31855 personality=1\n\nsetp hm2_6i25.0.gpio.023.is_output true\nsetp hm2_6i25.0.gpio.024.is_output true\n\nnet spi.clk.in    hm2_6i25.0.gpio.023.out     max31855.0.clk.out\nnet spi.cs.in     hm2_6i25.0.gpio.024.out     max31855.0.cs.out\nnet spi.data0.in  hm2_6i25.0.gpio.033.in_not  max31855.0.data.0.in\n\naddf max31855.0.bitbang-spi servo-thread\n----\n\nThe MAX31855 supports a range of -270C to 1800C, however linearization data \nis only available for the -200C to 1350C range, beyond which raw temperature is returned.\n\nTemperature pins are provided for readings in Celsius, Fahrenheit and Kelvin,\ntemperature values are not updated while a fault condition is present.\n\nThe personality parameter is used to indicate the number of sensors.\nMultiple sensors share the clk and cs pins, but connect to discrete data input pins.\nA maximum of 15 sensors are supported.\n\n""";\n\npin in  bit data.#.in [15 : (personality & 0xf)]  "Pin(s) connected to data out.";\npin out bit cs.out         "Pin connected to cs, pulled low to shift data, pulled high for data refresh.";\npin out bit clk.out        "Pin connected to clk.";\n\npin out float temp_celsius.# [15 : (personality & 0xf)] """Temperature output values in Celsius.""";\npin out float temp_fahrenheit.# [15 : (personality & 0xf)] """Temperature in Fahrenheit.""";\npin out float temp_kelvin.# [15 : (personality & 0xf)] """Temperature in Kelvin.""";\n\npin out bit fault.# [15 : (personality & 0xf)]  "Fault condition detected.";\npin out unsigned fault_flags.# [15 : (personality & 0xf)]  "Fault flags: 0x1  = open sensor, 0x2 short to gnd, 0x3 short to vcc.";\n\nvariable unsigned data_frame [15];\nvariable unsigned state = 1;\n\noption period no;\nfunction bitbang_spi fp;\nlicense "GPL";\nauthor "Joseph Calderon";\n\n',
        },
      },
    },
  ],
};

export default history;
