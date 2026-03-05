import type { GeneratedCatalogComponentHistory } from "../generatedTypes.ts";
import component_0 from "./components/abs.ts";
import component_1 from "./components/abs-s32.ts";
import component_2 from "./components/abs-s64.ts";
import component_3 from "./components/and2.ts";
import component_4 from "./components/anglejog.ts";
import component_5 from "./components/axistest.ts";
import component_6 from "./components/bin2gray.ts";
import component_7 from "./components/biquad.ts";
import component_8 from "./components/bitmerge.ts";
import component_9 from "./components/bitslice.ts";
import component_10 from "./components/bitwise.ts";
import component_11 from "./components/bldc.ts";
import component_12 from "./components/bldc-hall3.ts";
import component_13 from "./components/blend.ts";
import component_14 from "./components/carousel.ts";
import component_15 from "./components/charge-pump.ts";
import component_16 from "./components/clarke2.ts";
import component_17 from "./components/clarke3.ts";
import component_18 from "./components/clarkeinv.ts";
import component_19 from "./components/comp.ts";
import component_20 from "./components/constant.ts";
import component_21 from "./components/conv-bit-float.ts";
import component_22 from "./components/conv-bit-s32.ts";
import component_23 from "./components/conv-bit-s64.ts";
import component_24 from "./components/conv-bit-u32.ts";
import component_25 from "./components/conv-bit-u64.ts";
import component_26 from "./components/conv-float-s32.ts";
import component_27 from "./components/conv-float-s64.ts";
import component_28 from "./components/conv-float-u32.ts";
import component_29 from "./components/conv-float-u64.ts";
import component_30 from "./components/conv-s32-bit.ts";
import component_31 from "./components/conv-s32-float.ts";
import component_32 from "./components/conv-s32-s64.ts";
import component_33 from "./components/conv-s32-u32.ts";
import component_34 from "./components/conv-s32-u64.ts";
import component_35 from "./components/conv-s64-bit.ts";
import component_36 from "./components/conv-s64-float.ts";
import component_37 from "./components/conv-s64-s32.ts";
import component_38 from "./components/conv-s64-u32.ts";
import component_39 from "./components/conv-s64-u64.ts";
import component_40 from "./components/conv-u32-bit.ts";
import component_41 from "./components/conv-u32-float.ts";
import component_42 from "./components/conv-u32-s32.ts";
import component_43 from "./components/conv-u32-s64.ts";
import component_44 from "./components/conv-u32-u64.ts";
import component_45 from "./components/conv-u64-bit.ts";
import component_46 from "./components/conv-u64-float.ts";
import component_47 from "./components/conv-u64-s32.ts";
import component_48 from "./components/conv-u64-s64.ts";
import component_49 from "./components/conv-u64-u32.ts";
import component_50 from "./components/corexy-by-hal.ts";
import component_51 from "./components/dbounce.ts";
import component_52 from "./components/ddt.ts";
import component_53 from "./components/deadzone.ts";
import component_54 from "./components/demux.ts";
import component_55 from "./components/differential.ts";
import component_56 from "./components/div2.ts";
import component_57 from "./components/edge.ts";
import component_58 from "./components/eoffset-per-angle.ts";
import component_59 from "./components/estop-latch.ts";
import component_60 from "./components/feedcomp.ts";
import component_61 from "./components/filter-kalman.ts";
import component_62 from "./components/flipflop.ts";
import component_63 from "./components/gantry.ts";
import component_64 from "./components/gearchange.ts";
import component_65 from "./components/gray2bin.ts";
import component_66 from "./components/histobins.ts";
import component_67 from "./components/homecomp.ts";
import component_68 from "./components/hypot.ts";
import component_69 from "./components/ilowpass.ts";
import component_70 from "./components/integ.ts";
import component_71 from "./components/invert.ts";
import component_72 from "./components/joint-axis-mapper.ts";
import component_73 from "./components/joyhandle.ts";
import component_74 from "./components/knob2float.ts";
import component_75 from "./components/laserpower.ts";
import component_76 from "./components/latencybins.ts";
import component_77 from "./components/led-dim.ts";
import component_78 from "./components/limit-axis.ts";
import component_79 from "./components/limit1.ts";
import component_80 from "./components/limit2.ts";
import component_81 from "./components/limit3.ts";
import component_82 from "./components/lincurve.ts";
import component_83 from "./components/logic.ts";
import component_84 from "./components/lowpass.ts";
import component_85 from "./components/lut5.ts";
import component_86 from "./components/maj3.ts";
import component_87 from "./components/match8.ts";
import component_88 from "./components/matrixkins.ts";
import component_89 from "./components/max31855.ts";
import component_90 from "./components/mesa-pktgyro-test.ts";
import component_91 from "./components/message.ts";
import component_92 from "./components/millturn.ts";
import component_93 from "./components/minmax.ts";
import component_94 from "./components/moveoff.ts";
import component_95 from "./components/mult2.ts";
import component_96 from "./components/multiclick.ts";
import component_97 from "./components/multiswitch.ts";
import component_99 from "./components/mux2.ts";
import component_100 from "./components/mux4.ts";
import component_101 from "./components/mux8.ts";
import component_98 from "./components/mux16.ts";
import component_102 from "./components/near.ts";
import component_103 from "./components/not.ts";
import component_104 from "./components/offset.ts";
import component_105 from "./components/ohmic.ts";
import component_106 from "./components/oneshot.ts";
import component_107 from "./components/or2.ts";
import component_108 from "./components/orient.ts";
import component_109 from "./components/plasmac.ts";
import component_110 from "./components/raster.ts";
import component_111 from "./components/reset.ts";
import component_112 from "./components/safety-latch.ts";
import component_113 from "./components/sample-hold.ts";
import component_114 from "./components/scale.ts";
import component_115 from "./components/scaled-s32-sums.ts";
import component_116 from "./components/select8.ts";
import component_117 from "./components/sim-axis-hardware.ts";
import component_118 from "./components/sim-home-switch.ts";
import component_119 from "./components/sim-matrix-kb.ts";
import component_120 from "./components/sim-parport.ts";
import component_121 from "./components/sim-spindle.ts";
import component_122 from "./components/simple-tp.ts";
import component_123 from "./components/sphereprobe.ts";
import component_124 from "./components/spindle.ts";
import component_125 from "./components/spindle-monitor.ts";
import component_126 from "./components/steptest.ts";
import component_127 from "./components/sum2.ts";
import component_128 from "./components/thc.ts";
import component_129 from "./components/thcud.ts";
import component_130 from "./components/threadtest.ts";
import component_131 from "./components/time.ts";
import component_132 from "./components/timedelay.ts";
import component_133 from "./components/timedelta.ts";
import component_134 from "./components/tof.ts";
import component_135 from "./components/toggle.ts";
import component_136 from "./components/toggle2nist.ts";
import component_137 from "./components/ton.ts";
import component_138 from "./components/tp.ts";
import component_139 from "./components/tpcomp.ts";
import component_140 from "./components/tristate-bit.ts";
import component_141 from "./components/tristate-float.ts";
import component_142 from "./components/updown.ts";
import component_143 from "./components/userkins.ts";
import component_144 from "./components/wcomp.ts";
import component_145 from "./components/xhc-hb04-util.ts";
import component_146 from "./components/xor2.ts";
import component_147 from "./components/xyzab-tdr-kins.ts";
import component_148 from "./components/xyzacb-trsrn.ts";
import component_149 from "./components/xyzbca-trsrn.ts";
import meta from "./meta.ts";

export const GENERATED_CATALOG_VERSION_METADATA = meta;

export const GENERATED_CATALOG_COMPONENT_HISTORIES: GeneratedCatalogComponentHistory[] =
  [
    component_0,
    component_1,
    component_2,
    component_3,
    component_4,
    component_5,
    component_6,
    component_7,
    component_8,
    component_9,
    component_10,
    component_11,
    component_12,
    component_13,
    component_14,
    component_15,
    component_16,
    component_17,
    component_18,
    component_19,
    component_20,
    component_21,
    component_22,
    component_23,
    component_24,
    component_25,
    component_26,
    component_27,
    component_28,
    component_29,
    component_30,
    component_31,
    component_32,
    component_33,
    component_34,
    component_35,
    component_36,
    component_37,
    component_38,
    component_39,
    component_40,
    component_41,
    component_42,
    component_43,
    component_44,
    component_45,
    component_46,
    component_47,
    component_48,
    component_49,
    component_50,
    component_51,
    component_52,
    component_53,
    component_54,
    component_55,
    component_56,
    component_57,
    component_58,
    component_59,
    component_60,
    component_61,
    component_62,
    component_63,
    component_64,
    component_65,
    component_66,
    component_67,
    component_68,
    component_69,
    component_70,
    component_71,
    component_72,
    component_73,
    component_74,
    component_75,
    component_76,
    component_77,
    component_78,
    component_79,
    component_80,
    component_81,
    component_82,
    component_83,
    component_84,
    component_85,
    component_86,
    component_87,
    component_88,
    component_89,
    component_90,
    component_91,
    component_92,
    component_93,
    component_94,
    component_95,
    component_96,
    component_97,
    component_98,
    component_99,
    component_100,
    component_101,
    component_102,
    component_103,
    component_104,
    component_105,
    component_106,
    component_107,
    component_108,
    component_109,
    component_110,
    component_111,
    component_112,
    component_113,
    component_114,
    component_115,
    component_116,
    component_117,
    component_118,
    component_119,
    component_120,
    component_121,
    component_122,
    component_123,
    component_124,
    component_125,
    component_126,
    component_127,
    component_128,
    component_129,
    component_130,
    component_131,
    component_132,
    component_133,
    component_134,
    component_135,
    component_136,
    component_137,
    component_138,
    component_139,
    component_140,
    component_141,
    component_142,
    component_143,
    component_144,
    component_145,
    component_146,
    component_147,
    component_148,
    component_149,
  ];
