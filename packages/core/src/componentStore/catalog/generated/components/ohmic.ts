import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "ohmic",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:ohmic:ohmic",
        name: "ohmic",
        halComponentName: "ohmic",
        source: "comp",
        sourcePath: "src/hal/components/ohmic.comp",
        docs: {
          component:
            "LinuxCNC HAL component that uses a Mesa THCAD for Ohmic sensing",
          description:
            "\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD5, THCAD10 and THCAD300 cards.\nWhich is designed to allow user configurable voltage threshold for ohmic sensing.\nScaling of the Plasma arc voltage by a voltage divider is supported.\n.br\nOutput pins are provided for:\n.br\nohmic-volts (the voltage sensed on ohmic sensing)\n.br\nohmic-on (true if ohmic-volts >= ohmic-threshold)\n.br\narc-on (true if arc voltage is received eg. full scale reached or exceeded)\n.br\nActual voltage as read from the THCAD card (0-300V, 0-10V or 0-5V depending on the THCAD version used.\n.br\n\nNormally, we would use a THCAD-5 for ohmic sensing in conjunction with a 24 volt isolated power supply and a 390K resistor. (voltage divider = 4.9)\nThis would result in a full scale reading of 24.5 volts which is above the power supply output voltage.\n.br\nSo if full scale is reached, it can be assumed that the THCAD-5 is sensing an arc voltage.\nIn this case, the circuit will remain protected by the THCAD's ability to tolerate a 500V overvoltage indefinitely.\n.br\nIt is optional that power to the Ohmic sensing circuit be disconnected unless probing is in progress ut this adds additional complexity.\n.br\n\n\n\\\\fBEXAMPLE:\\\\fR\n.br\nTHCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended\nto 24.5 volts with a 390K external resistor as per the manual. Additional information and wiring diagram is contained in the Plasma Primer in hte main Linuxcnc documents.\n\n.br\n \n.br\nloadrt ohmic names=ohmicsense\n.br\naddf ohmicsense servo-thread\n.br\n.br\nsetp ohmicsense.thcad-0-volt-freq    122900\n.br\nsetp ohmicsense.thcad-max-volt-freq  925700\n.br\nsetp ohmicsense.thcad-divide         32\n.br\nsetp ohmicsense.thcad-fullscale      5\n.br\nsetp ohmicsense.volt-divider         32\n.br\nsetp ohmicsense.threshold            22\n.br\nsetp ohmicsense.ohmic-low            1\n.br\nnet ohmic-vel ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\n.br\nnet ohmic-true ohmicsense.ohmic-on => plasmac.ohmic-probe\n",
          author: "Rod Webster",
          license: "GPL",
        },
        pins: [
          {
            key: "thcad_0_volt_freq",
            name: "thcad-0-volt-freq",
            type: "float",
            doc: "0 volt calibration data for THCAD card in Hz",
            direction: "in",
          },
          {
            key: "thcad_max_volt_freq",
            name: "thcad-max-volt-freq",
            type: "float",
            doc: "Full scale calibration data for THCAD Card in Hz",
            direction: "in",
          },
          {
            key: "thcad_divide",
            name: "thcad-divide",
            type: "float",
            doc: "THCAD Divider set by links on THCAD board (1,32,64 or 128",
            defaultValue: "32",
            direction: "in",
          },
          {
            key: "thcad_fullscale",
            name: "thcad-fullscale",
            type: "float",
            doc: "THCAD Fullscale (5, 10 or 300)",
            defaultValue: "5",
            direction: "in",
          },
          {
            key: "velocity_in",
            name: "velocity-in",
            type: "float",
            doc: "The velocity returned from the THCAD and read by the Mesa encoder input",
            direction: "in",
          },
          {
            key: "volt_divider",
            name: "volt-divider",
            type: "float",
            doc: "The divide ratio (default 1:1)",
            defaultValue: "4.9",
            direction: "in",
          },
          {
            key: "ohmic_threshold",
            name: "ohmic-threshold",
            type: "float",
            doc: "The threshold  volts above which Ohmic sensing is set to be true",
            defaultValue: "18",
            direction: "in",
          },
          {
            key: "ohmic_low",
            name: "ohmic-low",
            type: "float",
            doc: "The threshold  volts below which Ohmic sensing is set to be false",
            defaultValue: "5",
            direction: "in",
          },
          {
            key: "arc_on",
            name: "arc-on",
            type: "bit",
            doc: "True if full scale (eg arc is on)",
            direction: "out",
          },
          {
            key: "thcad_volts",
            name: "thcad-volts",
            type: "float",
            doc: "Measured thcad voltage",
            direction: "out",
          },
          {
            key: "ohmic_volts",
            name: "ohmic-volts",
            type: "float",
            doc: "Calculated Ohmic  voltage",
            direction: "out",
          },
          {
            key: "ohmic_on",
            name: "ohmic-on",
            type: "bit",
            doc: "Threshold plasma torch voltage",
            direction: "out",
          },
          {
            key: "is_probing",
            name: "is-probing",
            type: "bit",
            doc: "True if probing",
            direction: "in",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component ohmic "LinuxCNC HAL component that uses a Mesa THCAD for Ohmic sensing";\n\ndescription\n"""\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD5, THCAD10 and THCAD300 cards.\nWhich is designed to allow user configurable voltage threshold for ohmic sensing.\nScaling of the Plasma arc voltage by a voltage divider is supported.\n.br\nOutput pins are provided for:\n.br\nohmic-volts (the voltage sensed on ohmic sensing)\n.br\nohmic-on (true if ohmic-volts >= ohmic-threshold)\n.br\narc-on (true if arc voltage is received eg. full scale reached or exceeded)\n.br\nActual voltage as read from the THCAD card (0-300V, 0-10V or 0-5V depending on the THCAD version used.\n.br\n\nNormally, we would use a THCAD-5 for ohmic sensing in conjunction with a 24 volt isolated power supply and a 390K resistor. (voltage divider = 4.9)\nThis would result in a full scale reading of 24.5 volts which is above the power supply output voltage.\n.br\nSo if full scale is reached, it can be assumed that the THCAD-5 is sensing an arc voltage.\nIn this case, the circuit will remain protected by the THCAD\'s ability to tolerate a 500V overvoltage indefinitely.\n.br\nIt is optional that power to the Ohmic sensing circuit be disconnected unless probing is in progress ut this adds additional complexity.\n.br\n\n\n\\\\fBEXAMPLE:\\\\fR\n.br\nTHCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended\nto 24.5 volts with a 390K external resistor as per the manual. Additional information and wiring diagram is contained in the Plasma Primer in hte main Linuxcnc documents.\n\n.br\n \n.br\nloadrt ohmic names=ohmicsense\n.br\naddf ohmicsense servo-thread\n.br\n.br\nsetp ohmicsense.thcad-0-volt-freq    122900\n.br\nsetp ohmicsense.thcad-max-volt-freq  925700\n.br\nsetp ohmicsense.thcad-divide         32\n.br\nsetp ohmicsense.thcad-fullscale      5\n.br\nsetp ohmicsense.volt-divider         32\n.br\nsetp ohmicsense.threshold            22\n.br\nsetp ohmicsense.ohmic-low            1\n.br\nnet ohmic-vel ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\n.br\nnet ohmic-true ohmicsense.ohmic-on => plasmac.ohmic-probe\n""";\n\n\nauthor "Rod Webster";\n\n// Example Calibration Data: 0v = 122.9 kHz, 10v = 925.7 Khz should be entered as 122900 and 925700\npin in  float thcad_0_volt_freq          "0 volt calibration data for THCAD card in Hz";\npin in  float thcad_max_volt_freq        "Full scale calibration data for THCAD Card in Hz";\npin in  float thcad_divide = 32          "THCAD Divider set by links on THCAD board (1,32,64 or 128";\npin in  float thcad_fullscale = 5        "THCAD Fullscale (5, 10 or 300)";\npin in  float velocity_in                "The velocity returned from the THCAD and read by the Mesa encoder input";\npin in  float volt_divider = 4.9         "The divide ratio (default 1:1)";\npin in  float ohmic_threshold = 18       "The threshold  volts above which Ohmic sensing is set to be true";\npin in  float ohmic_low = 5              "The threshold  volts below which Ohmic sensing is set to be false";\npin out  bit arc_on                       "True if full scale (eg arc is on)";\npin out float thcad_volts                "Measured thcad voltage";\npin out float ohmic_volts                "Calculated Ohmic  voltage";\npin out bit   ohmic_on                   "Threshold plasma torch voltage";\npin in bit  is_probing                  "True if probing";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:ohmic:ohmic",
        name: "ohmic",
        halComponentName: "ohmic",
        source: "comp",
        sourcePath: "src/hal/components/ohmic.comp",
        docs: {
          component:
            "LinuxCNC HAL component that uses a Mesa THCAD for ohmic sensing",
          description:
            "\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD2, THCAD5, THCAD10, and THCAD300 cards.\n.br\nAllows user configurable voltage thresholds for ohmic sensing.\n\nOutput pins are provided for:\n.br\nohmic-volts -the voltage sensed on ohmic sensing.\n.br\nthcad-volts -the actual voltage measured by the THCAD.\n.br\nohmic-on    -true if ohmic-volts >= ohmic-threshold, false if ohmic-volts <= ohmic-low.\n\nA THCAD-5 would often be used for ohmic sensing in conjunction with a 24 Volt isolated power supply and a 390 kΩ series resistor resulting in a voltage divider of 4.9.\n.br\nThis would result in a full scale reading of 24.5 Volts which is above the power supply output voltage.\n.br\nThe circuit will remain protected by the THCAD's ability to tolerate a 500 Volt over-voltage indefinitely.\n.br\nIt is optional that power to the ohmic sensing circuit be disconnected unless probing is in progress.\n",
          examples:
            "\n.br\nThe below HAL example assumes a THCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended to 24.5 volts by a series 390K external resistor as per the manual.\nAdditional information and wiring diagram is contained in the Plasma Primer in the LinuxCNC documentation.\n.br\nExample Calibration Data: 0V = 122.9 kHz, 10V = 925.7 kHz should be entered as 122900 and 925700.\n\nloadrt ohmic names=ohmicsense\n.br\naddf ohmicsense servo-thread\n.br\nsetp ohmicsense.thcad-0-volt-freq    122900\n.br\nsetp ohmicsense.thcad-max-volt-freq  925700\n.br\nsetp ohmicsense.thcad-divide         32\n.br\nsetp ohmicsense.thcad-fullscale      5\n.br\nsetp ohmicsense.volt-divider         4.9\n.br\nsetp ohmicsense.threshold            22\n.br\nsetp ohmicsense.ohmic-low            21\n.br\nnet ohmic-vel    ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\n.br\nnet ohmic-enable ohmicsense.is_probing  <= plasmac.ohmic-enable\n.br\nnet ohmic-true   ohmicsense.ohmic-on    => plasmac.ohmic-probe\n",
          author: "Rod Webster",
          license: "GPL",
        },
        pins: [
          {
            key: "is_probing",
            name: "is-probing",
            type: "bit",
            doc: "True if probing",
            direction: "in",
          },
          {
            key: "ohmic_low",
            name: "ohmic-low",
            type: "float",
            doc: "The threshold volts below which ohmic sensing is set to be false",
            defaultValue: "21",
            direction: "in",
          },
          {
            key: "ohmic_threshold",
            name: "ohmic-threshold",
            type: "float",
            doc: "The threshold volts above which ohmic sensing is set to be true",
            defaultValue: "22",
            direction: "in",
          },
          {
            key: "thcad_0_volt_freq",
            name: "thcad-0-volt-freq",
            type: "float",
            doc: "0 volt calibration data for THCAD card in Hz",
            direction: "in",
          },
          {
            key: "thcad_divide",
            name: "thcad-divide",
            type: "float",
            doc: "THCAD divider set by links on THCAD board (1, 32, 64, or 128)",
            defaultValue: "32",
            direction: "in",
          },
          {
            key: "thcad_fullscale",
            name: "thcad-fullscale",
            type: "float",
            doc: "THCAD full scale in Volt (5, 10, or 300 Volt)",
            defaultValue: "5",
            direction: "in",
          },
          {
            key: "thcad_max_volt_freq",
            name: "thcad-max-volt-freq",
            type: "float",
            doc: "Full scale calibration data for THCAD Card in Hz",
            direction: "in",
          },
          {
            key: "velocity_in",
            name: "velocity-in",
            type: "float",
            doc: "The velocity returned from the THCAD and read by the Mesa encoder input",
            direction: "in",
          },
          {
            key: "volt_divider",
            name: "volt-divider",
            type: "float",
            doc: "The divide ratio",
            defaultValue: "4.9",
            direction: "in",
          },
          {
            key: "ohmic_on",
            name: "ohmic-on",
            type: "bit",
            doc: "True if ohmic circuit is closed (material is sensed)",
            direction: "out",
          },
          {
            key: "ohmic_volts",
            name: "ohmic-volts",
            type: "float",
            doc: "Calculated ohmic voltage",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component ohmic "LinuxCNC HAL component that uses a Mesa THCAD for ohmic sensing";\n\ndescription\n"""\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD2, THCAD5, THCAD10, and THCAD300 cards.\n.br\nAllows user configurable voltage thresholds for ohmic sensing.\n\nOutput pins are provided for:\n.br\nohmic-volts -the voltage sensed on ohmic sensing.\n.br\nthcad-volts -the actual voltage measured by the THCAD.\n.br\nohmic-on    -true if ohmic-volts >= ohmic-threshold, false if ohmic-volts <= ohmic-low.\n\nA THCAD-5 would often be used for ohmic sensing in conjunction with a 24 Volt isolated power supply and a 390 kΩ series resistor resulting in a voltage divider of 4.9.\n.br\nThis would result in a full scale reading of 24.5 Volts which is above the power supply output voltage.\n.br\nThe circuit will remain protected by the THCAD\'s ability to tolerate a 500 Volt over-voltage indefinitely.\n.br\nIt is optional that power to the ohmic sensing circuit be disconnected unless probing is in progress.\n""";\n\nexamples """\n.br\nThe below HAL example assumes a THCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended to 24.5 volts by a series 390K external resistor as per the manual.\nAdditional information and wiring diagram is contained in the Plasma Primer in the LinuxCNC documentation.\n.br\nExample Calibration Data: 0V = 122.9 kHz, 10V = 925.7 kHz should be entered as 122900 and 925700.\n\nloadrt ohmic names=ohmicsense\n.br\naddf ohmicsense servo-thread\n.br\nsetp ohmicsense.thcad-0-volt-freq    122900\n.br\nsetp ohmicsense.thcad-max-volt-freq  925700\n.br\nsetp ohmicsense.thcad-divide         32\n.br\nsetp ohmicsense.thcad-fullscale      5\n.br\nsetp ohmicsense.volt-divider         4.9\n.br\nsetp ohmicsense.threshold            22\n.br\nsetp ohmicsense.ohmic-low            21\n.br\nnet ohmic-vel    ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\n.br\nnet ohmic-enable ohmicsense.is_probing  <= plasmac.ohmic-enable\n.br\nnet ohmic-true   ohmicsense.ohmic-on    => plasmac.ohmic-probe\n""";\n\nauthor "Rod Webster";\n\npin in  bit   is_probing                 "True if probing";\npin in  float ohmic_low = 21             "The threshold volts below which ohmic sensing is set to be false";\npin in  float ohmic_threshold = 22       "The threshold volts above which ohmic sensing is set to be true";\npin in  float thcad_0_volt_freq          "0 volt calibration data for THCAD card in Hz";\npin in  float thcad_divide = 32          "THCAD divider set by links on THCAD board (1, 32, 64, or 128)";\npin in  float thcad_fullscale = 5        "THCAD full scale in Volt (5, 10, or 300 Volt)";\npin in  float thcad_max_volt_freq        "Full scale calibration data for THCAD Card in Hz";\npin in  float velocity_in                "The velocity returned from the THCAD and read by the Mesa encoder input";\npin in  float volt_divider = 4.9         "The divide ratio";\npin out bit   ohmic_on                   "True if ohmic circuit is closed (material is sensed)";\npin out float ohmic_volts                "Calculated ohmic voltage";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:ohmic:ohmic",
        name: "ohmic",
        halComponentName: "ohmic",
        source: "comp",
        sourcePath: "src/hal/components/ohmic.comp",
        docs: {
          component:
            "LinuxCNC HAL component that uses a Mesa THCAD for ohmic sensing",
          description:
            "\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD2, THCAD5, THCAD10, and THCAD300 cards.\n\nAllows user configurable voltage thresholds for ohmic sensing.\n\nOutput pins are provided for:\n\nohmic-volts -the voltage sensed on ohmic sensing.\n\nthcad-volts -the actual voltage measured by the THCAD.\n\nohmic-on    -true if ohmic-volts ≥ ohmic-threshold, false if ohmic-volts ≤ ohmic-low.\n\nA THCAD-5 would often be used for ohmic sensing in conjunction with a 24 Volt isolated power supply and a 390 kΩ series resistor resulting in a voltage divider of 4.9.\n\nThis would result in a full scale reading of 24.5 Volts which is above the power supply output voltage.\n\nThe circuit will remain protected by the THCAD's ability to tolerate a 500 Volt over-voltage indefinitely.\n\nIt is optional that power to the ohmic sensing circuit be disconnected unless probing is in progress.\n",
          examples:
            "\nThe below HAL example assumes a THCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended to 24.5 volts by a series 390K external resistor as per the manual.\nAdditional information and wiring diagram is contained in the Plasma Primer in the LinuxCNC documentation.\n\nExample Calibration Data: 0V = 122.9 kHz, 10V = 925.7 kHz should be entered as 122900 and 925700.\n\n[source,hal]\n----\nloadrt ohmic names=ohmicsense\naddf ohmicsense servo-thread\nsetp ohmicsense.thcad-0-volt-freq    122900\nsetp ohmicsense.thcad-max-volt-freq  925700\nsetp ohmicsense.thcad-divide         32\nsetp ohmicsense.thcad-fullscale      5\nsetp ohmicsense.volt-divider         4.9\nsetp ohmicsense.threshold            22\nsetp ohmicsense.ohmic-low            21\nnet ohmic-vel    ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\nnet ohmic-enable ohmicsense.is_probing  <= plasmac.ohmic-enable\nnet ohmic-true   ohmicsense.ohmic-on    => plasmac.ohmic-probe\n----\n\n",
          author: "Rod Webster",
          license: "GPL",
        },
        pins: [
          {
            key: "is_probing",
            name: "is-probing",
            type: "bit",
            doc: "True if probing",
            direction: "in",
          },
          {
            key: "ohmic_low",
            name: "ohmic-low",
            type: "float",
            doc: "The threshold volts below which ohmic sensing is set to be false",
            defaultValue: "21",
            direction: "in",
          },
          {
            key: "ohmic_threshold",
            name: "ohmic-threshold",
            type: "float",
            doc: "The threshold volts above which ohmic sensing is set to be true",
            defaultValue: "22",
            direction: "in",
          },
          {
            key: "thcad_0_volt_freq",
            name: "thcad-0-volt-freq",
            type: "float",
            doc: "0 volt calibration data for THCAD card in Hz",
            direction: "in",
          },
          {
            key: "thcad_divide",
            name: "thcad-divide",
            type: "float",
            doc: "THCAD divider set by links on THCAD board (1, 32, 64, or 128)",
            defaultValue: "32",
            direction: "in",
          },
          {
            key: "thcad_fullscale",
            name: "thcad-fullscale",
            type: "float",
            doc: "THCAD full scale in Volt (5, 10, or 300 Volt)",
            defaultValue: "5",
            direction: "in",
          },
          {
            key: "thcad_max_volt_freq",
            name: "thcad-max-volt-freq",
            type: "float",
            doc: "Full scale calibration data for THCAD Card in Hz",
            direction: "in",
          },
          {
            key: "velocity_in",
            name: "velocity-in",
            type: "float",
            doc: "The velocity returned from the THCAD and read by the Mesa encoder input",
            direction: "in",
          },
          {
            key: "volt_divider",
            name: "volt-divider",
            type: "float",
            doc: "The divide ratio",
            defaultValue: "4.9",
            direction: "in",
          },
          {
            key: "ohmic_on",
            name: "ohmic-on",
            type: "bit",
            doc: "True if ohmic circuit is closed (material is sensed)",
            direction: "out",
          },
          {
            key: "ohmic_volts",
            name: "ohmic-volts",
            type: "float",
            doc: "Calculated ohmic voltage",
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
            'component ohmic "LinuxCNC HAL component that uses a Mesa THCAD for ohmic sensing";\n\ndescription\n"""\nMesa THCAD Card component to scale input and outputs from the Mesa THCAD2, THCAD5, THCAD10, and THCAD300 cards.\n\nAllows user configurable voltage thresholds for ohmic sensing.\n\nOutput pins are provided for:\n\nohmic-volts -the voltage sensed on ohmic sensing.\n\nthcad-volts -the actual voltage measured by the THCAD.\n\nohmic-on    -true if ohmic-volts ≥ ohmic-threshold, false if ohmic-volts ≤ ohmic-low.\n\nA THCAD-5 would often be used for ohmic sensing in conjunction with a 24 Volt isolated power supply and a 390 kΩ series resistor resulting in a voltage divider of 4.9.\n\nThis would result in a full scale reading of 24.5 Volts which is above the power supply output voltage.\n\nThe circuit will remain protected by the THCAD\'s ability to tolerate a 500 Volt over-voltage indefinitely.\n\nIt is optional that power to the ohmic sensing circuit be disconnected unless probing is in progress.\n""";\n\nexamples """\nThe below HAL example assumes a THCAD5 card using a 1/32 frequency setting and a voltage divider internal to the plasma cutter with range extended to 24.5 volts by a series 390K external resistor as per the manual.\nAdditional information and wiring diagram is contained in the Plasma Primer in the LinuxCNC documentation.\n\nExample Calibration Data: 0V = 122.9 kHz, 10V = 925.7 kHz should be entered as 122900 and 925700.\n\n[source,hal]\n----\nloadrt ohmic names=ohmicsense\naddf ohmicsense servo-thread\nsetp ohmicsense.thcad-0-volt-freq    122900\nsetp ohmicsense.thcad-max-volt-freq  925700\nsetp ohmicsense.thcad-divide         32\nsetp ohmicsense.thcad-fullscale      5\nsetp ohmicsense.volt-divider         4.9\nsetp ohmicsense.threshold            22\nsetp ohmicsense.ohmic-low            21\nnet ohmic-vel    ohmicsense.velocity-in <= hm2_7i76e.0.encoder.00.velocity\nnet ohmic-enable ohmicsense.is_probing  <= plasmac.ohmic-enable\nnet ohmic-true   ohmicsense.ohmic-on    => plasmac.ohmic-probe\n----\n\n""";\n\nauthor "Rod Webster";\n\npin in  bit   is_probing                 "True if probing";\npin in  float ohmic_low = 21             "The threshold volts below which ohmic sensing is set to be false";\npin in  float ohmic_threshold = 22       "The threshold volts above which ohmic sensing is set to be true";\npin in  float thcad_0_volt_freq          "0 volt calibration data for THCAD card in Hz";\npin in  float thcad_divide = 32          "THCAD divider set by links on THCAD board (1, 32, 64, or 128)";\npin in  float thcad_fullscale = 5        "THCAD full scale in Volt (5, 10, or 300 Volt)";\npin in  float thcad_max_volt_freq        "Full scale calibration data for THCAD Card in Hz";\npin in  float velocity_in                "The velocity returned from the THCAD and read by the Mesa encoder input";\npin in  float volt_divider = 4.9         "The divide ratio";\npin out bit   ohmic_on                   "True if ohmic circuit is closed (material is sensed)";\npin out float ohmic_volts                "Calculated ohmic voltage";\n\noption period no;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
  ],
};

export default history;
