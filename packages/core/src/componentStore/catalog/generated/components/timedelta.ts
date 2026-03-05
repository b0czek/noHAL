import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "timedelta",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:timedelta:timedelta",
        name: "timedelta",
        halComponentName: "timedelta",
        source: "comp",
        sourcePath: "src/hal/components/timedelta.comp",
        docs: {
          component:
            "LinuxCNC HAL component that measures thread scheduling timing behavior",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "s32",
            direction: "out",
          },
          {
            key: "err",
            name: "err",
            type: "s32",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "jitter",
            name: "jitter",
            type: "s32",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "avg_err",
            name: "avg-err",
            type: "float",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component timedelta "LinuxCNC HAL component that measures thread scheduling timing behavior";\npin out s32 out;\npin out s32 err=0;\npin out s32 min_=0;\npin out s32 max_=0;\npin out s32 jitter=0;\npin out float avg_err=0;\npin in bit reset;\nfunction _ nofp;\nvariable rtapi_s64 last=0;\nvariable int first=1;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:timedelta:timedelta",
        name: "timedelta",
        halComponentName: "timedelta",
        source: "comp",
        sourcePath: "src/hal/components/timedelta.comp",
        docs: {
          component:
            "LinuxCNC HAL component that measures thread scheduling timing behavior",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "jitter",
            name: "jitter",
            type: "s32",
            doc: "Worst-case scheduling error (in ns).  This is the largest discrepancy between ideal thread period, and actual time between sequential runs of this component.  This uses the absolute value of the error, so 'got run too early' and 'got run too late' both show up as positive jitter.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "current_jitter",
            name: "current-jitter",
            type: "s32",
            doc: "Scheduling error (in ns) of the current invocation.  This is the discrepancy between ideal thread period, and actual time since the previous run of this component.  This uses the absolute value of the error, so 'got run too early' and 'got run too late' both show up as positive jitter.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "current_error",
            name: "current-error",
            type: "s32",
            doc: "Scheduling error (in ns) of the current invocation.  This is the discrepancy between ideal thread period, and actual time since the previous run of this component.  This does not use the absolute value of the error, so 'got run too early' shows up as negative error and 'got run too late' shows up as positive error.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            doc: "Minimum time (in ns) between sequential runs of this component.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            doc: "Maximum time (in ns) between sequential runs of this component.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Set this pin to True, then back to False, to reset some of the statistics.",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            doc: "Time (in ns) since the previous run of this component.  This should ideally be equal to the thread period.",
            direction: "out",
          },
          {
            key: "err",
            name: "err",
            type: "s32",
            doc: "Cumulative time error (in ns).  Probably not useful.",
            defaultValue: "0",
            direction: "out",
          },
          {
            key: "avg_err",
            name: "avg-err",
            type: "float",
            doc: "The average scheduling error (in ns).",
            defaultValue: "0",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component timedelta "LinuxCNC HAL component that measures thread scheduling timing behavior";\n\npin out s32 jitter=0 "Worst-case scheduling error (in ns).  This is the largest discrepancy between ideal thread period, and actual time between sequential runs of this component.  This uses the absolute value of the error, so \'got run too early\' and \'got run too late\' both show up as positive jitter.";\n\npin out s32 current_jitter=0 "Scheduling error (in ns) of the current invocation.  This is the discrepancy between ideal thread period, and actual time since the previous run of this component.  This uses the absolute value of the error, so \'got run too early\' and \'got run too late\' both show up as positive jitter.";\n\npin out s32 current_error=0 "Scheduling error (in ns) of the current invocation.  This is the discrepancy between ideal thread period, and actual time since the previous run of this component.  This does not use the absolute value of the error, so \'got run too early\' shows up as negative error and \'got run too late\' shows up as positive error.";\n\npin out s32 min_=0 "Minimum time (in ns) between sequential runs of this component.";\n\npin out s32 max_=0 "Maximum time (in ns) between sequential runs of this component.";\n\npin in bit reset "Set this pin to True, then back to False, to reset some of the statistics.";\n\npin out s32 out "Time (in ns) since the previous run of this component.  This should ideally be equal to the thread period.";\n\npin out s32 err=0 "Cumulative time error (in ns).  Probably not useful.";\n\npin out float avg_err=0 "The average scheduling error (in ns).";\n\n\nfunction _ nofp;\nvariable rtapi_s64 last=0;\nvariable int first=1;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
