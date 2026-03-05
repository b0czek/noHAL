import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "latencybins",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:latencybins:latencybins",
        name: "latencybins",
        halComponentName: "latencybins",
        source: "comp",
        sourcePath: "src/hal/components/latencybins.comp",
        docs: {
          component:
            "comp utility for scripts/latency-histogram\n\nUsage:\n  Read availablebins pin for the number of bins available.\n  Set the maxbinnumber pin for the number of \\(+- bins.\n    Ensure maxbinnumber <= availablebins\n    For maxbinnumber = N, the bins are numbered:\n       \\-N ... 0 ... + N bins\n    (the \\-0 bin is not populated)\n    (total effective bins = 2*maxbinnumber +1)\n  Set nsbinsize pin for the binsize (ns)\n  Iterate:\n    Set index pin to a bin number: 0 <= index <= maxbinnumber.\n    Read check pin and verify that check pin == index pin.\n    Read output pins:\n         pbinvalue is count for bin = +index\n         nbinvalue is count for bin = \\-index\n         pextra    is count for all bins > maxbinnumber\n         nextra    is count for all bins < maxbinnumber\n         latency-min is max negative latency\n         latency-max is max positive latency\n\n   If index is out of range ( index < 0 or index > maxbinnumber)\n   then pbinvalue = nbinvalue = \\-1.\n   The reset pin may be used to restart.\n   The latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n",
          license: "GPL",
        },
        pins: [
          {
            key: "maxbinnumber",
            name: "maxbinnumber",
            type: "s32",
            defaultValue: "1000",
            direction: "in",
          },
          {
            key: "index",
            name: "index",
            type: "s32",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "nsbinsize",
            name: "nsbinsize",
            type: "s32",
            direction: "in",
          },
          {
            key: "check",
            name: "check",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency",
            name: "latency",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_max",
            name: "latency-max",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_min",
            name: "latency-min",
            type: "s32",
            direction: "out",
          },
          {
            key: "pbinvalue",
            name: "pbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "nbinvalue",
            name: "nbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "pextra",
            name: "pextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "nextra",
            name: "nextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "variance",
            name: "variance",
            type: "s32",
            direction: "out",
          },
          {
            key: "availablebins",
            name: "availablebins",
            type: "s32",
            defaultValue: "1000",
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
            'component latencybins\n"""comp utility for scripts/latency-histogram\n\nUsage:\n  Read availablebins pin for the number of bins available.\n  Set the maxbinnumber pin for the number of \\(+- bins.\n    Ensure maxbinnumber <= availablebins\n    For maxbinnumber = N, the bins are numbered:\n       \\-N ... 0 ... + N bins\n    (the \\-0 bin is not populated)\n    (total effective bins = 2*maxbinnumber +1)\n  Set nsbinsize pin for the binsize (ns)\n  Iterate:\n    Set index pin to a bin number: 0 <= index <= maxbinnumber.\n    Read check pin and verify that check pin == index pin.\n    Read output pins:\n         pbinvalue is count for bin = +index\n         nbinvalue is count for bin = \\-index\n         pextra    is count for all bins > maxbinnumber\n         nextra    is count for all bins < maxbinnumber\n         latency-min is max negative latency\n         latency-max is max positive latency\n\n   If index is out of range ( index < 0 or index > maxbinnumber)\n   then pbinvalue = nbinvalue = \\-1.\n   The reset pin may be used to restart.\n   The latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n""";\n\npin in  s32 maxbinnumber = 1000;  // MAXBINNUMBER\npin in  s32 index;  //use s32 to avoid 0x hex display in hal\npin in  bit reset;\npin in  s32 nsbinsize;\n\npin out s32 check;\npin out s32 latency;\npin out s32 latency_max;\npin out s32 latency_min;\npin out s32 pbinvalue;\npin out s32 nbinvalue;\npin out s32 pextra;\npin out s32 nextra;\npin out s32 variance;\n\n// user may interrogate available bins to determine this compiled-in limit\npin out s32 availablebins = 1000; // MAXBINNUMBER\n\nfunction _ nofp;\nvariable rtapi_s64  last_timer = 0;\nvariable int    last_binmax = 0;\nvariable int    first = 1;\nvariable int    pbins[1001]; // MAXBINNUMBER+1\nvariable int    nbins[1001]; // MAXBINNUMBER+1\nvariable int    binmax = 0;\n\nvariable rtapi_u32 nsamples;\nvariable rtapi_u64 sum;\nvariable rtapi_u64 sq_sum;\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:latencybins:latencybins",
        name: "latencybins",
        halComponentName: "latencybins",
        source: "comp",
        sourcePath: "src/hal/components/latencybins.comp",
        docs: {
          component:
            "comp utility for scripts/latency-histogram\n\nUsage:\n  Read availablebins pin for the number of bins available.\n  Set the maxbinnumber pin for the number of \\\\(+- bins.\n    Ensure maxbinnumber <= availablebins\n    For maxbinnumber = N, the bins are numbered:\n       -N ... 0 ... + N bins\n    (the -0 bin is not populated)\n    (total effective bins = 2*maxbinnumber +1)\n  Set nsbinsize pin for the binsize (ns)\n  Iterate:\n    Set index pin to a bin number: 0 <= index <= maxbinnumber.\n    Read check pin and verify that check pin == index pin.\n    Read output pins:\n         pbinvalue is count for bin = +index\n         nbinvalue is count for bin = -index\n         pextra    is count for all bins > maxbinnumber\n         nextra    is count for all bins < maxbinnumber\n         latency-min is max negative latency\n         latency-max is max positive latency\n\n   If index is out of range ( index < 0 or index > maxbinnumber)\n   then pbinvalue = nbinvalue = -1.\n   The reset pin may be used to restart.\n   The latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "maxbinnumber",
            name: "maxbinnumber",
            type: "s32",
            defaultValue: "1000",
            direction: "in",
          },
          {
            key: "index",
            name: "index",
            type: "s32",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "nsbinsize",
            name: "nsbinsize",
            type: "s32",
            direction: "in",
          },
          {
            key: "check",
            name: "check",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency",
            name: "latency",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_max",
            name: "latency-max",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_min",
            name: "latency-min",
            type: "s32",
            direction: "out",
          },
          {
            key: "pbinvalue",
            name: "pbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "nbinvalue",
            name: "nbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "pextra",
            name: "pextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "nextra",
            name: "nextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "variance",
            name: "variance",
            type: "s32",
            direction: "out",
          },
          {
            key: "availablebins",
            name: "availablebins",
            type: "s32",
            defaultValue: "1000",
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
            'component latencybins\n"""comp utility for scripts/latency-histogram\n\nUsage:\n  Read availablebins pin for the number of bins available.\n  Set the maxbinnumber pin for the number of \\\\(+- bins.\n    Ensure maxbinnumber <= availablebins\n    For maxbinnumber = N, the bins are numbered:\n       -N ... 0 ... + N bins\n    (the -0 bin is not populated)\n    (total effective bins = 2*maxbinnumber +1)\n  Set nsbinsize pin for the binsize (ns)\n  Iterate:\n    Set index pin to a bin number: 0 <= index <= maxbinnumber.\n    Read check pin and verify that check pin == index pin.\n    Read output pins:\n         pbinvalue is count for bin = +index\n         nbinvalue is count for bin = -index\n         pextra    is count for all bins > maxbinnumber\n         nextra    is count for all bins < maxbinnumber\n         latency-min is max negative latency\n         latency-max is max positive latency\n\n   If index is out of range ( index < 0 or index > maxbinnumber)\n   then pbinvalue = nbinvalue = -1.\n   The reset pin may be used to restart.\n   The latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n""";\n\npin in  s32 maxbinnumber = 1000;  // MAXBINNUMBER\npin in  s32 index;  //use s32 to avoid 0x hex display in hal\npin in  bit reset;\npin in  s32 nsbinsize;\n\npin out s32 check;\npin out s32 latency;\npin out s32 latency_max;\npin out s32 latency_min;\npin out s32 pbinvalue;\npin out s32 nbinvalue;\npin out s32 pextra;\npin out s32 nextra;\npin out s32 variance;\n\n// user may interrogate available bins to determine this compiled-in limit\npin out s32 availablebins = 1000; // MAXBINNUMBER\n\nfunction _ nofp;\nvariable rtapi_s64  last_timer = 0;\nvariable int    last_binmax = 0;\nvariable int    first = 1;\nvariable int    pbins[1001]; // MAXBINNUMBER+1\nvariable int    nbins[1001]; // MAXBINNUMBER+1\nvariable int    binmax = 0;\n\nvariable rtapi_u32 nsamples;\nvariable rtapi_u64 sum;\nvariable rtapi_u64 sq_sum;\n\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:latencybins:latencybins",
        name: "latencybins",
        halComponentName: "latencybins",
        source: "comp",
        sourcePath: "src/hal/components/latencybins.comp",
        docs: {
          component: "comp utility for scripts/latency-histogram\n",
          description:
            "\nRead *availablebins* pin for the number of bins available. Set the\n*maxbinnumber* pin for the number of ±;bins.\nEnsure *maxbinnumber* ≤ *availablebins*.\n\nFor *maxbinnumber* = N, the bins are numbered:\n\n* -N ... 0 ... +N bins +\n  (the -0 bin is not populated) +\n  (total effective bins = 2 * maxbinnumber + 1)\n\nSet *nsbinsize* pin for the binsize (ns).\n\nIterate:\n\n* Set *index* pin to a bin number: 0 ≤ *index* ≤ maxbinnumber.\n* Read check pin and verify that check pin == *index* pin.\n* Read output pins:\n** *pbinvalue* is count for bin = +*index*\n** *nbinvalue* is count for bin = -*index*\n** *pextra*    is count for all bins > *maxbinnumber*\n** *nextra*    is count for all bins < *maxbinnumber*\n** *latency-min* is max negative latency\n** *latency-max* is max positive latency\n\nIf *index* is out of range (*index* < 0 or *index* > *maxbinnumber*)\nthen *pbinvalue* = *nbinvalue* = -1. The reset pin may be used to restart.\n\nThe latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n",
          license: "GPL",
          author: "Dewey Garrett",
        },
        pins: [
          {
            key: "maxbinnumber",
            name: "maxbinnumber",
            type: "s32",
            defaultValue: "1000",
            direction: "in",
          },
          {
            key: "index",
            name: "index",
            type: "s32",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            direction: "in",
          },
          {
            key: "nsbinsize",
            name: "nsbinsize",
            type: "s32",
            direction: "in",
          },
          {
            key: "check",
            name: "check",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency",
            name: "latency",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_max",
            name: "latency-max",
            type: "s32",
            direction: "out",
          },
          {
            key: "latency_min",
            name: "latency-min",
            type: "s32",
            direction: "out",
          },
          {
            key: "pbinvalue",
            name: "pbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "nbinvalue",
            name: "nbinvalue",
            type: "s32",
            direction: "out",
          },
          {
            key: "pextra",
            name: "pextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "nextra",
            name: "nextra",
            type: "s32",
            direction: "out",
          },
          {
            key: "variance",
            name: "variance",
            type: "s32",
            direction: "out",
          },
          {
            key: "availablebins",
            name: "availablebins",
            type: "s32",
            defaultValue: "1000",
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
            'component latencybins\n"""comp utility for scripts/latency-histogram\n""";\ndescription """\nRead *availablebins* pin for the number of bins available. Set the\n*maxbinnumber* pin for the number of ±;bins.\nEnsure *maxbinnumber* ≤ *availablebins*.\n\nFor *maxbinnumber* = N, the bins are numbered:\n\n* -N ... 0 ... +N bins +\n  (the -0 bin is not populated) +\n  (total effective bins = 2 * maxbinnumber + 1)\n\nSet *nsbinsize* pin for the binsize (ns).\n\nIterate:\n\n* Set *index* pin to a bin number: 0 ≤ *index* ≤ maxbinnumber.\n* Read check pin and verify that check pin == *index* pin.\n* Read output pins:\n** *pbinvalue* is count for bin = +*index*\n** *nbinvalue* is count for bin = -*index*\n** *pextra*    is count for all bins > *maxbinnumber*\n** *nextra*    is count for all bins < *maxbinnumber*\n** *latency-min* is max negative latency\n** *latency-max* is max positive latency\n\nIf *index* is out of range (*index* < 0 or *index* > *maxbinnumber*)\nthen *pbinvalue* = *nbinvalue* = -1. The reset pin may be used to restart.\n\nThe latency pin outputs the instantaneous latency.\n\nMaintainers note: hardcoded for MAXBINNUMBER==1000\n""";\n\npin in  s32 maxbinnumber = 1000;  // MAXBINNUMBER\npin in  s32 index;  //use s32 to avoid 0x hex display in hal\npin in  bit reset;\npin in  s32 nsbinsize;\n\npin out s32 check;\npin out s32 latency;\npin out s32 latency_max;\npin out s32 latency_min;\npin out s32 pbinvalue;\npin out s32 nbinvalue;\npin out s32 pextra;\npin out s32 nextra;\npin out s32 variance;\n\n// user may interrogate available bins to determine this compiled-in limit\npin out s32 availablebins = 1000; // MAXBINNUMBER\n\nfunction _ nofp;\nvariable rtapi_s64  last_timer = 0;\nvariable int    last_binmax = 0;\nvariable int    first = 1;\nvariable int    pbins[1001]; // MAXBINNUMBER+1\nvariable int    nbins[1001]; // MAXBINNUMBER+1\nvariable int    binmax = 0;\n\nvariable rtapi_u32 nsamples;\nvariable rtapi_u64 sum;\nvariable rtapi_u64 sq_sum;\n\nlicense "GPL";\nauthor "Dewey Garrett";\n',
        },
      },
    },
  ],
};

export default history;
