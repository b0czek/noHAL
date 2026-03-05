import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "time",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:time:time",
        name: "time",
        halComponentName: "time",
        source: "comp",
        sourcePath: "src/hal/components/time.comp",
        docs: {
          component: "Time on in Hours, Minutes, Seconds",
          description:
            '\nTime\n\nWhen either the time.N.start or time.N.pause bits goes true the cycle\ntimer resets and starts to time until time.N.start AND time.N.pause go\nfalse. When the time.N.pause bit goes true timing is paused until\ntime.N.pause goes false. If you connect time.N.start to\nhalui.program.is-running and leave time.N.pause unconnected the timer\nwill reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that time.N.start is true.\n\nSample pyVCP code to display the hours:minutes:seconds.\n\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n\nIn your post-gui.hal file you might use one of the following to connect\nthis timer:\n \n For a new config:\n \n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n\n\n Previous to this version if you wanted the timer to continue running\n during a pause instead of resetting, you had to use a HAL NOT component\n to invert the halui.program.is-idle pin and connect to time.N.start as\n shown below:\n\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n \n For those who have this setup already, you can simply add a net connecting\n time.N.pause to halui.program.is-paused:\n\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n\n\n',
          author: "John Thornton, itaib, Moses McKnight",
          license: "GPL",
        },
        pins: [
          {
            key: "start",
            name: "start",
            type: "bit",
            doc: "Timer On",
            direction: "in",
          },
          {
            key: "pause",
            name: "pause",
            type: "bit",
            doc: "Pause",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "seconds",
            name: "seconds",
            type: "u32",
            doc: "Seconds",
            direction: "out",
          },
          {
            key: "minutes",
            name: "minutes",
            type: "u32",
            doc: "Minutes",
            direction: "out",
          },
          {
            key: "hours",
            name: "hours",
            type: "u32",
            doc: "Hours",
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
            'component time "Time on in Hours, Minutes, Seconds";\n\ndescription \n"""\nTime\n\nWhen either the time.N.start or time.N.pause bits goes true the cycle\ntimer resets and starts to time until time.N.start AND time.N.pause go\nfalse. When the time.N.pause bit goes true timing is paused until\ntime.N.pause goes false. If you connect time.N.start to\nhalui.program.is-running and leave time.N.pause unconnected the timer\nwill reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that time.N.start is true.\n\nSample pyVCP code to display the hours:minutes:seconds.\n\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n\nIn your post-gui.hal file you might use one of the following to connect\nthis timer:\n \n For a new config:\n \n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n\n\n Previous to this version if you wanted the timer to continue running\n during a pause instead of resetting, you had to use a HAL NOT component\n to invert the halui.program.is-idle pin and connect to time.N.start as\n shown below:\n\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n \n For those who have this setup already, you can simply add a net connecting\n time.N.pause to halui.program.is-paused:\n\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n\n\n""";\n \nauthor "John Thornton, itaib, Moses McKnight";\n\nlicense "GPL";\n\n// Input Pins\npin in bit start "Timer On";\npin in bit pause = 0 "Pause";\n\n// Output Pins\npin out u32 seconds "Seconds";\npin out u32 minutes "Minutes";\npin out u32 hours "Hours";\n\n// Global Variables\nvariable double totalnsec;\nvariable int old_start;\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:time:time",
        name: "time",
        halComponentName: "time",
        source: "comp",
        sourcePath: "src/hal/components/time.comp",
        docs: {
          component: "Time on in Hours, Minutes, Seconds",
          description:
            '\nTime\n\nWhen either the time.N.start or time.N.pause bits goes true the cycle\ntimer resets and starts to time until time.N.start AND time.N.pause go\nfalse. When the time.N.pause bit goes true timing is paused until\ntime.N.pause goes false. If you connect time.N.start to\nhalui.program.is-running and leave time.N.pause unconnected the timer\nwill reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that time.N.start is true.\n\nSample PyVCP code to display the hours:minutes:seconds.\n\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n\nIn your post-gui.hal file you might use one of the following to connect\nthis timer:\n \n For a new config:\n \n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n\n\n Previous to this version if you wanted the timer to continue running\n during a pause instead of resetting, you had to use a HAL NOT component\n to invert the halui.program.is-idle pin and connect to time.N.start as\n shown below:\n\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n \n For those who have this setup already, you can simply add a net connecting\n time.N.pause to halui.program.is-paused:\n\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n\n\n',
          author: "John Thornton, itaib, Moses McKnight",
          license: "GPL",
        },
        pins: [
          {
            key: "start",
            name: "start",
            type: "bit",
            doc: "Timer On",
            direction: "in",
          },
          {
            key: "pause",
            name: "pause",
            type: "bit",
            doc: "Pause",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "seconds",
            name: "seconds",
            type: "u32",
            doc: "Seconds",
            direction: "out",
          },
          {
            key: "minutes",
            name: "minutes",
            type: "u32",
            doc: "Minutes",
            direction: "out",
          },
          {
            key: "hours",
            name: "hours",
            type: "u32",
            doc: "Hours",
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
            'component time "Time on in Hours, Minutes, Seconds";\n\ndescription \n"""\nTime\n\nWhen either the time.N.start or time.N.pause bits goes true the cycle\ntimer resets and starts to time until time.N.start AND time.N.pause go\nfalse. When the time.N.pause bit goes true timing is paused until\ntime.N.pause goes false. If you connect time.N.start to\nhalui.program.is-running and leave time.N.pause unconnected the timer\nwill reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that time.N.start is true.\n\nSample PyVCP code to display the hours:minutes:seconds.\n\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n\nIn your post-gui.hal file you might use one of the following to connect\nthis timer:\n \n For a new config:\n \n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n\n\n Previous to this version if you wanted the timer to continue running\n during a pause instead of resetting, you had to use a HAL NOT component\n to invert the halui.program.is-idle pin and connect to time.N.start as\n shown below:\n\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n \n For those who have this setup already, you can simply add a net connecting\n time.N.pause to halui.program.is-paused:\n\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n\n\n""";\n \nauthor "John Thornton, itaib, Moses McKnight";\n\nlicense "GPL";\n\n// Input Pins\npin in bit start "Timer On";\npin in bit pause = 0 "Pause";\n\n// Output Pins\npin out u32 seconds "Seconds";\npin out u32 minutes "Minutes";\npin out u32 hours "Hours";\n\n// Global Variables\nvariable double totalnsec;\nvariable int old_start;\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:time:time",
        name: "time",
        halComponentName: "time",
        source: "comp",
        sourcePath: "src/hal/components/time.comp",
        docs: {
          component: "Time on in Hours, Minutes, Seconds",
          description:
            '\nTime\n\nWhen either the *time*._N_.*start* or *time*._N_.*pause* bits goes true the\ncycle timer resets and starts to time until *time*._N_.*start* AND *time*._N_.*pause*\ngo false. When the *time*._N_.*pause* bit goes true timing is paused\nuntil *time*._N_.*pause* goes false. If you connect *time*._N_.*start*\nto *halui*.*program*.*is-running* and leave *time*._N_.*pause* unconnected the\ntimer will reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that *time*._N_.*start* is true.\n\nSample PyVCP code to display the hours:minutes:seconds.\n\n[source,xml]\n----\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n----\n\nIn your `post-gui.hal` file you might use one of the following to connect\nthis timer:\n \nFor a new config:\n \n[source,hal]\n----\n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n----\n\nPrevious to this version if you wanted the timer to continue running\nduring a pause instead of resetting, you had to use a HAL NOT component\nto invert the *halui*.*program*.*is-idle* pin and connect\nto *time*._N_.*start* as shown below:\n\n[source,hal]\n----\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n----\n\nFor those who have this setup already, you can simply add a net\nconnecting *time*._N_.*pause* to *halui*.*program*.*is-paused*:\n\n[source,hal]\n----\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n----\n\n',
          author: "John Thornton, itaib, Moses McKnight",
          license: "GPL",
        },
        pins: [
          {
            key: "start",
            name: "start",
            type: "bit",
            doc: "Timer On",
            direction: "in",
          },
          {
            key: "pause",
            name: "pause",
            type: "bit",
            doc: "Pause",
            defaultValue: "0",
            direction: "in",
          },
          {
            key: "seconds",
            name: "seconds",
            type: "u32",
            doc: "Seconds",
            direction: "out",
          },
          {
            key: "minutes",
            name: "minutes",
            type: "u32",
            doc: "Minutes",
            direction: "out",
          },
          {
            key: "hours",
            name: "hours",
            type: "u32",
            doc: "Hours",
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
            'component time "Time on in Hours, Minutes, Seconds";\n\ndescription \n"""\nTime\n\nWhen either the *time*._N_.*start* or *time*._N_.*pause* bits goes true the\ncycle timer resets and starts to time until *time*._N_.*start* AND *time*._N_.*pause*\ngo false. When the *time*._N_.*pause* bit goes true timing is paused\nuntil *time*._N_.*pause* goes false. If you connect *time*._N_.*start*\nto *halui*.*program*.*is-running* and leave *time*._N_.*pause* unconnected the\ntimer will reset during a pause. See the example connections below for more\ninformation.\n\nTime returns the hours, minutes, and seconds that *time*._N_.*start* is true.\n\nSample PyVCP code to display the hours:minutes:seconds.\n\n[source,xml]\n----\n<pyvcp>\n  <hbox>\n  <label>\n    <text>"Cycle Time"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-hours"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-minutes"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  <label>\n    <text>":"</text>\n    <font>("Helvetica",14)</font>\n  </label>\n  <u32> \n      <halpin>"time-seconds"</halpin>\n      <font>("Helvetica",14)</font>\n      <format>"2d"</format>\n  </u32>\n  </hbox>\n</pyvcp>\n----\n\nIn your `post-gui.hal` file you might use one of the following to connect\nthis timer:\n \nFor a new config:\n \n[source,hal]\n----\n loadrt time\n addf time.0 servo-thread\n net cycle-timer        time.0.start <= halui.program.is-running\n net cycle-timer-pause  time.0.pause <= halui.program.is-paused\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n----\n\nPrevious to this version if you wanted the timer to continue running\nduring a pause instead of resetting, you had to use a HAL NOT component\nto invert the *halui*.*program*.*is-idle* pin and connect\nto *time*._N_.*start* as shown below:\n\n[source,hal]\n----\n loadrt time\n loadrt not\n addf time.0 servo-thread\n addf not.0 servo-thread\n net prog-running not.0.in <= halui.program.is-idle\n net cycle-timer time.0.start <= not.0.out\n net cycle-seconds pyvcp.time-seconds <= time.0.seconds\n net cycle-minutes pyvcp.time-minutes <= time.0.minutes\n net cycle-hours pyvcp.time-hours <= time.0.hours\n----\n\nFor those who have this setup already, you can simply add a net\nconnecting *time*._N_.*pause* to *halui*.*program*.*is-paused*:\n\n[source,hal]\n----\n net cycle-timer-pause time.0.pause <= halui.program.is-paused\n----\n\n""";\n \nauthor "John Thornton, itaib, Moses McKnight";\n\nlicense "GPL";\n\n// Input Pins\npin in bit start "Timer On";\npin in bit pause = 0 "Pause";\n\n// Output Pins\npin out u32 seconds "Seconds";\npin out u32 minutes "Minutes";\npin out u32 hours "Hours";\n\n// Global Variables\nvariable double totalnsec;\nvariable int old_start;\n\nfunction _;\n\n',
        },
      },
    },
  ],
};

export default history;
