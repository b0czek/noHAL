import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "lut5",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:lut5:lut5",
        name: "lut5",
        halComponentName: "lut5",
        source: "comp",
        sourcePath: "src/hal/components/lut5.comp",
        docs: {
          component:
            "Arbitrary 5-input logic function based on a look-up table",
          description:
            '\n.B lut5\nconstructs a logic function with up to 5 inputs using a\n\\\\fBl\\\\fRook-\\\\fBu\\\\fRp \\\\fBt\\\\fRable. The value for \\\\fBfunction\\\\fR can be\ndetermined by writing the truth table, and computing the sum of \\\\fBall\\\\fR\nthe \\\\fBweights\\\\fR for which the output value would be \\\\fRTRUE\\\\fR.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to\nsum the weights. A wiki page has a calculator to assist in computing the proper\nvalue for function.\n.PP\nhttp://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n.PP\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so \\\\fBAND\\\\fR, \\\\fBOR\\\\fR, \\\\fBNAND\\\\fR,\n\\\\fBNOR\\\\fR, \\\\fBXOR\\\\fR and every other combinatorial function is possible.\n.PP\n.SS Example Functions\nA 5-input\n\\\\fIand\\\\fR function is TRUE only when all the inputs are true, so the correct\nvalue for \\\\fBfunction\\\\fR is \\\\fB0x80000000\\\\fR.\n.PP\nA 2-input \\\\fIor\\\\fR function would be the sum of \\\\fB0x2\\\\fR + \\\\fB0x4\\\\fR +\n\\\\fB0x8\\\\fR, so the correct value for \\\\fBfunction\\\\fR is \\\\fB0xe\\\\fR.\n.PP\nA 5-input \\\\fIor\\\\fR\nfunction is TRUE whenever any of the inputs are true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0xfffffffe\\\\fR. Because every weight except \\\\fB0x1\\\\fR\nis true the function is the sum of every line except the first one.\n.PP\nA 2-input \\\\fIxor\\\\fR function is\nTRUE whenever exactly one of the inputs is true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0x6\\\\fR.  Only \\\\fBin-0\\\\fR and \\\\fBin-1\\\\fR should be\nconnected to signals, because if any other bit is \\\\fBTRUE\\\\fR then the output\nwill be \\\\fBFALSE\\\\fR.\n.PP\n.ie \'\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#weight TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="weight" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n    <COL SPAN=5 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH COLSPAN=6>Weights for each line of truth table \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH>Bit 4<TH>Bit 3<TH>Bit 2<TH>Bit 1<TH>Bit 0<TH> Weight \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x1 \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x2 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x4 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x8 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x10 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x20 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x40 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x80 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x100 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x200 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x400 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x800 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x1000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x2000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x4000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x8000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x10000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x20000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x40000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x80000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x100000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x200000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x400000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x800000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x1000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x2000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x4000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x8000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x10000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x20000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x40000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x80000000 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n.TS\nbox tab(;);\ncb s s s s s\ncb cb cb cb cb | cb\nc  c  c  c  c  | r.\nWeights for each line of truth table\n_\nBit 4;Bit 3;Bit 2;Bit 1;Bit 0; Weight\n_\n0;0;0;0;0;0x1\n0;0;0;0;1;0x2\n0;0;0;1;0;0x4\n0;0;0;1;1;0x8\n0;0;1;0;0;0x10\n0;0;1;0;1;0x20\n0;0;1;1;0;0x40\n0;0;1;1;1;0x80\n0;1;0;0;0;0x100\n0;1;0;0;1;0x200\n0;1;0;1;0;0x400\n0;1;0;1;1;0x800\n0;1;1;0;0;0x1000\n0;1;1;0;1;0x2000\n0;1;1;1;0;0x4000\n0;1;1;1;1;0x8000\n1;0;0;0;0;0x10000\n1;0;0;0;1;0x20000\n1;0;0;1;0;0x40000\n1;0;0;1;1;0x80000\n1;0;1;0;0;0x100000\n1;0;1;0;1;0x200000\n1;0;1;1;0;0x400000\n1;0;1;1;1;0x800000\n1;1;0;0;0;0x1000000\n1;1;0;0;1;0x2000000\n1;1;0;1;0;0x4000000\n1;1;0;1;1;0x8000000\n1;1;1;0;0;0x10000000\n1;1;1;0;1;0x20000000\n1;1;1;1;0;0x40000000\n1;1;1;1;1;0x80000000\n.TE\n\\\\}\n',
          license: "GPL",
        },
        pins: [
          {
            key: "in_0",
            name: "in-0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_1",
            name: "in-1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_2",
            name: "in-2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_3",
            name: "in-3",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_4",
            name: "in-4",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "function",
            name: "function",
            type: "u32",
            direction: "rw",
          },
        ],
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
            'component lut5 """Arbitrary 5-input logic function based on a look-up table""";\npin in bit in_0;\npin in bit in_1;\npin in bit in_2;\npin in bit in_3;\npin in bit in_4;\npin out bit out;\nparam rw u32 function;\nfunction _ nofp;\ndescription """\n.B lut5\nconstructs a logic function with up to 5 inputs using a\n\\\\fBl\\\\fRook-\\\\fBu\\\\fRp \\\\fBt\\\\fRable. The value for \\\\fBfunction\\\\fR can be\ndetermined by writing the truth table, and computing the sum of \\\\fBall\\\\fR\nthe \\\\fBweights\\\\fR for which the output value would be \\\\fRTRUE\\\\fR.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to\nsum the weights. A wiki page has a calculator to assist in computing the proper\nvalue for function.\n.PP\nhttp://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n.PP\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so \\\\fBAND\\\\fR, \\\\fBOR\\\\fR, \\\\fBNAND\\\\fR,\n\\\\fBNOR\\\\fR, \\\\fBXOR\\\\fR and every other combinatorial function is possible.\n.PP\n.SS Example Functions\nA 5-input\n\\\\fIand\\\\fR function is TRUE only when all the inputs are true, so the correct\nvalue for \\\\fBfunction\\\\fR is \\\\fB0x80000000\\\\fR.\n.PP\nA 2-input \\\\fIor\\\\fR function would be the sum of \\\\fB0x2\\\\fR + \\\\fB0x4\\\\fR +\n\\\\fB0x8\\\\fR, so the correct value for \\\\fBfunction\\\\fR is \\\\fB0xe\\\\fR.\n.PP\nA 5-input \\\\fIor\\\\fR\nfunction is TRUE whenever any of the inputs are true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0xfffffffe\\\\fR. Because every weight except \\\\fB0x1\\\\fR\nis true the function is the sum of every line except the first one.\n.PP\nA 2-input \\\\fIxor\\\\fR function is\nTRUE whenever exactly one of the inputs is true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0x6\\\\fR.  Only \\\\fBin-0\\\\fR and \\\\fBin-1\\\\fR should be\nconnected to signals, because if any other bit is \\\\fBTRUE\\\\fR then the output\nwill be \\\\fBFALSE\\\\fR.\n.PP\n.ie \'\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#weight TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="weight" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n    <COL SPAN=5 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH COLSPAN=6>Weights for each line of truth table \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH>Bit 4<TH>Bit 3<TH>Bit 2<TH>Bit 1<TH>Bit 0<TH> Weight \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x1 \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x2 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x4 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x8 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x10 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x20 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x40 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x80 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x100 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x200 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x400 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x800 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x1000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x2000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x4000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x8000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x10000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x20000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x40000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x80000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x100000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x200000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x400000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x800000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x1000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x2000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x4000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x8000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x10000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x20000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x40000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x80000000 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n.TS\nbox tab(;);\ncb s s s s s\ncb cb cb cb cb | cb\nc  c  c  c  c  | r.\nWeights for each line of truth table\n_\nBit 4;Bit 3;Bit 2;Bit 1;Bit 0; Weight\n_\n0;0;0;0;0;0x1\n0;0;0;0;1;0x2\n0;0;0;1;0;0x4\n0;0;0;1;1;0x8\n0;0;1;0;0;0x10\n0;0;1;0;1;0x20\n0;0;1;1;0;0x40\n0;0;1;1;1;0x80\n0;1;0;0;0;0x100\n0;1;0;0;1;0x200\n0;1;0;1;0;0x400\n0;1;0;1;1;0x800\n0;1;1;0;0;0x1000\n0;1;1;0;1;0x2000\n0;1;1;1;0;0x4000\n0;1;1;1;1;0x8000\n1;0;0;0;0;0x10000\n1;0;0;0;1;0x20000\n1;0;0;1;0;0x40000\n1;0;0;1;1;0x80000\n1;0;1;0;0;0x100000\n1;0;1;0;1;0x200000\n1;0;1;1;0;0x400000\n1;0;1;1;1;0x800000\n1;1;0;0;0;0x1000000\n1;1;0;0;1;0x2000000\n1;1;0;1;0;0x4000000\n1;1;0;1;1;0x8000000\n1;1;1;0;0;0x10000000\n1;1;1;0;1;0x20000000\n1;1;1;1;0;0x40000000\n1;1;1;1;1;0x80000000\n.TE\n\\\\}\n""";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:lut5:lut5",
        name: "lut5",
        halComponentName: "lut5",
        source: "comp",
        sourcePath: "src/hal/components/lut5.comp",
        docs: {
          component:
            "Arbitrary 5-input logic function based on a look-up table",
          description:
            '\n.B lut5\nconstructs a logic function with up to 5 inputs using a \\\\fBl\\\\fRook-\\\\fBu\\\\fRp \\\\fBt\\\\fRable.\nThe value for \\\\fBfunction\\\\fR can be determined by writing the truth table,\nand computing the sum of \\\\fBall\\\\fR the \\\\fBweights\\\\fR for which the output value would be \\\\fRTRUE\\\\fR.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to sum the weights.\nA wiki page has a calculator to assist in computing the proper value for function.\n.PP\nhttps://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n.PP\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so \\\\fBAND\\\\fR, \\\\fBOR\\\\fR, \\\\fBNAND\\\\fR,\n\\\\fBNOR\\\\fR, \\\\fBXOR\\\\fR and every other combinatorial function is possible.\n.PP\n.SS Example Functions\nA 5-input\n\\\\fIand\\\\fR function is TRUE only when all the inputs are true, so the correct\nvalue for \\\\fBfunction\\\\fR is \\\\fB0x80000000\\\\fR.\n.PP\nA 2-input \\\\fIor\\\\fR function would be the sum of \\\\fB0x2\\\\fR + \\\\fB0x4\\\\fR +\n\\\\fB0x8\\\\fR, so the correct value for \\\\fBfunction\\\\fR is \\\\fB0xe\\\\fR.\n.PP\nA 5-input \\\\fIor\\\\fR\nfunction is TRUE whenever any of the inputs are true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0xfffffffe\\\\fR. Because every weight except \\\\fB0x1\\\\fR\nis true the function is the sum of every line except the first one.\n.PP\nA 2-input \\\\fIxor\\\\fR function is\nTRUE whenever exactly one of the inputs is true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0x6\\\\fR.  Only \\\\fBin-0\\\\fR and \\\\fBin-1\\\\fR should be\nconnected to signals, because if any other bit is \\\\fBTRUE\\\\fR then the output\nwill be \\\\fBFALSE\\\\fR.\n.PP\n.ie \'\\\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#weight TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="weight" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n    <COL SPAN=5 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH COLSPAN=6>Weights for each line of truth table \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH>Bit 4<TH>Bit 3<TH>Bit 2<TH>Bit 1<TH>Bit 0<TH> Weight \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x1 \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x2 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x4 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x8 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x10 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x20 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x40 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x80 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x100 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x200 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x400 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x800 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x1000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x2000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x4000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x8000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x10000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x20000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x40000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x80000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x100000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x200000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x400000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x800000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x1000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x2000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x4000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x8000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x10000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x20000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x40000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x80000000 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n.TS\nbox tab(;);\ncb s s s s s\ncb cb cb cb cb | cb\nc  c  c  c  c  | r.\nWeights for each line of truth table\n_\nBit 4;Bit 3;Bit 2;Bit 1;Bit 0; Weight\n_\n0;0;0;0;0;0x1\n0;0;0;0;1;0x2\n0;0;0;1;0;0x4\n0;0;0;1;1;0x8\n0;0;1;0;0;0x10\n0;0;1;0;1;0x20\n0;0;1;1;0;0x40\n0;0;1;1;1;0x80\n0;1;0;0;0;0x100\n0;1;0;0;1;0x200\n0;1;0;1;0;0x400\n0;1;0;1;1;0x800\n0;1;1;0;0;0x1000\n0;1;1;0;1;0x2000\n0;1;1;1;0;0x4000\n0;1;1;1;1;0x8000\n1;0;0;0;0;0x10000\n1;0;0;0;1;0x20000\n1;0;0;1;0;0x40000\n1;0;0;1;1;0x80000\n1;0;1;0;0;0x100000\n1;0;1;0;1;0x200000\n1;0;1;1;0;0x400000\n1;0;1;1;1;0x800000\n1;1;0;0;0;0x1000000\n1;1;0;0;1;0x2000000\n1;1;0;1;0;0x4000000\n1;1;0;1;1;0x8000000\n1;1;1;0;0;0x10000000\n1;1;1;0;1;0x20000000\n1;1;1;1;0;0x40000000\n1;1;1;1;1;0x80000000\n.TE\n\\\\}\n',
          seeAlso:
            "\n\\\\fBand\\\\fR(9),\n\\\\fBlogic\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in_0",
            name: "in-0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_1",
            name: "in-1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_2",
            name: "in-2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_3",
            name: "in-3",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_4",
            name: "in-4",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "function",
            name: "function",
            type: "u32",
            direction: "rw",
          },
        ],
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
            'component lut5 """Arbitrary 5-input logic function based on a look-up table""";\npin in bit in_0;\npin in bit in_1;\npin in bit in_2;\npin in bit in_3;\npin in bit in_4;\npin out bit out;\nparam rw u32 function;\nfunction _ nofp;\ndescription """\n.B lut5\nconstructs a logic function with up to 5 inputs using a \\\\fBl\\\\fRook-\\\\fBu\\\\fRp \\\\fBt\\\\fRable.\nThe value for \\\\fBfunction\\\\fR can be determined by writing the truth table,\nand computing the sum of \\\\fBall\\\\fR the \\\\fBweights\\\\fR for which the output value would be \\\\fRTRUE\\\\fR.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to sum the weights.\nA wiki page has a calculator to assist in computing the proper value for function.\n.PP\nhttps://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n.PP\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so \\\\fBAND\\\\fR, \\\\fBOR\\\\fR, \\\\fBNAND\\\\fR,\n\\\\fBNOR\\\\fR, \\\\fBXOR\\\\fR and every other combinatorial function is possible.\n.PP\n.SS Example Functions\nA 5-input\n\\\\fIand\\\\fR function is TRUE only when all the inputs are true, so the correct\nvalue for \\\\fBfunction\\\\fR is \\\\fB0x80000000\\\\fR.\n.PP\nA 2-input \\\\fIor\\\\fR function would be the sum of \\\\fB0x2\\\\fR + \\\\fB0x4\\\\fR +\n\\\\fB0x8\\\\fR, so the correct value for \\\\fBfunction\\\\fR is \\\\fB0xe\\\\fR.\n.PP\nA 5-input \\\\fIor\\\\fR\nfunction is TRUE whenever any of the inputs are true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0xfffffffe\\\\fR. Because every weight except \\\\fB0x1\\\\fR\nis true the function is the sum of every line except the first one.\n.PP\nA 2-input \\\\fIxor\\\\fR function is\nTRUE whenever exactly one of the inputs is true, so the correct value for\n\\\\fBfunction\\\\fR is \\\\fB0x6\\\\fR.  Only \\\\fBin-0\\\\fR and \\\\fBin-1\\\\fR should be\nconnected to signals, because if any other bit is \\\\fBTRUE\\\\fR then the output\nwill be \\\\fBFALSE\\\\fR.\n.PP\n.ie \'\\\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#weight TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#weight TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="weight" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n    <COL SPAN=5 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH COLSPAN=6>Weights for each line of truth table \\\\\n<TR STYLE="border-bottom: 1px solid black"> \\\\\n    <TH>Bit 4<TH>Bit 3<TH>Bit 2<TH>Bit 1<TH>Bit 0<TH> Weight \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x1 \\\\\n<TR><TD>0<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x2 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x4 \\\\\n<TR><TD>0<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x8 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x10 \\\\\n<TR><TD>0<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x20 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x40 \\\\\n<TR><TD>0<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x80 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x100 \\\\\n<TR><TD>0<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x200 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x400 \\\\\n<TR><TD>0<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x800 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x1000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x2000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x4000 \\\\\n<TR><TD>0<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x8000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>0<TD CLASS="w">0x10000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>0<TD>1<TD CLASS="w">0x20000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>0<TD CLASS="w">0x40000 \\\\\n<TR><TD>1<TD>0<TD>0<TD>1<TD>1<TD CLASS="w">0x80000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>0<TD CLASS="w">0x100000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>0<TD>1<TD CLASS="w">0x200000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>0<TD CLASS="w">0x400000 \\\\\n<TR><TD>1<TD>0<TD>1<TD>1<TD>1<TD CLASS="w">0x800000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>0<TD CLASS="w">0x1000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>0<TD>1<TD CLASS="w">0x2000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>0<TD CLASS="w">0x4000000 \\\\\n<TR><TD>1<TD>1<TD>0<TD>1<TD>1<TD CLASS="w">0x8000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>0<TD CLASS="w">0x10000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>0<TD>1<TD CLASS="w">0x20000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>0<TD CLASS="w">0x40000000 \\\\\n<TR><TD>1<TD>1<TD>1<TD>1<TD>1<TD CLASS="w">0x80000000 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n.TS\nbox tab(;);\ncb s s s s s\ncb cb cb cb cb | cb\nc  c  c  c  c  | r.\nWeights for each line of truth table\n_\nBit 4;Bit 3;Bit 2;Bit 1;Bit 0; Weight\n_\n0;0;0;0;0;0x1\n0;0;0;0;1;0x2\n0;0;0;1;0;0x4\n0;0;0;1;1;0x8\n0;0;1;0;0;0x10\n0;0;1;0;1;0x20\n0;0;1;1;0;0x40\n0;0;1;1;1;0x80\n0;1;0;0;0;0x100\n0;1;0;0;1;0x200\n0;1;0;1;0;0x400\n0;1;0;1;1;0x800\n0;1;1;0;0;0x1000\n0;1;1;0;1;0x2000\n0;1;1;1;0;0x4000\n0;1;1;1;1;0x8000\n1;0;0;0;0;0x10000\n1;0;0;0;1;0x20000\n1;0;0;1;0;0x40000\n1;0;0;1;1;0x80000\n1;0;1;0;0;0x100000\n1;0;1;0;1;0x200000\n1;0;1;1;0;0x400000\n1;0;1;1;1;0x800000\n1;1;0;0;0;0x1000000\n1;1;0;0;1;0x2000000\n1;1;0;1;0;0x4000000\n1;1;0;1;1;0x8000000\n1;1;1;0;0;0x10000000\n1;1;1;0;1;0x20000000\n1;1;1;1;0;0x40000000\n1;1;1;1;1;0x80000000\n.TE\n\\\\}\n""";\nsee_also """\n\\\\fBand\\\\fR(9),\n\\\\fBlogic\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:lut5:lut5",
        name: "lut5",
        halComponentName: "lut5",
        source: "comp",
        sourcePath: "src/hal/components/lut5.comp",
        docs: {
          component:
            "Arbitrary 5-input logic function based on a look-up table",
          description:
            '\n*lut5*\nconstructs a logic function with up to 5 inputs using a **l**ook-**u**p **t**able.\nThe value for *function* can be determined by writing the truth table,\nand computing the sum of *all* the *weights* for which the output value would be *TRUE*.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to sum the weights.\nA wiki page has a calculator to assist in computing the proper value for function.\n\nhttps://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so *AND*, *OR*, *NAND*,\n*NOR*, *XOR* and every other combinatorial function is possible.\n\n=== Example Functions\nA 5-input *and* function is TRUE only when all the inputs are true, so the\ncorrect value for *function* is *0x80000000*.\n\nA 2-input *or* function would be the sum of *0x2* + *0x4* + *0x8*, so the\ncorrect value for *function* is *0xe*.\n\nA 5-input *or* function is TRUE whenever any of the inputs are true, so the\ncorrect value for *function* is *0xfffffffe*. Because every weight except *0x1*\nis true the function is the sum of every line except the first one.\n\nA 2-input *xor* function is TRUE whenever exactly one of the inputs is true, so\nthe correct value for *function* is *0x6*.  Only *in-0* and *in-1* should be\nconnected to signals, because if any other bit is *TRUE* then the output will\nbe *FALSE*.\n\n[cols="^1,^1,^1,^1,^1,>1"]\n|===\n6+^h|Weights for each line of truth table\n\n^h|Bit 4\n^h|Bit 3\n^h|Bit 2\n^h|Bit 1\n^h|Bit 0\n2+^h|Weight\n\n|0|0|0|0|0|0x00000001\n|0|0|0|0|1|0x00000002\n|0|0|0|1|0|0x00000004\n|0|0|0|1|1|0x00000008\n|0|0|1|0|0|0x00000010\n|0|0|1|0|1|0x00000020\n|0|0|1|1|0|0x00000040\n|0|0|1|1|1|0x00000080\n|0|1|0|0|0|0x00000100\n|0|1|0|0|1|0x00000200\n|0|1|0|1|0|0x00000400\n|0|1|0|1|1|0x00000800\n|0|1|1|0|0|0x00001000\n|0|1|1|0|1|0x00002000\n|0|1|1|1|0|0x00004000\n|0|1|1|1|1|0x00008000\n|1|0|0|0|0|0x00010000\n|1|0|0|0|1|0x00020000\n|1|0|0|1|0|0x00040000\n|1|0|0|1|1|0x00080000\n|1|0|1|0|0|0x00100000\n|1|0|1|0|1|0x00200000\n|1|0|1|1|0|0x00400000\n|1|0|1|1|1|0x00800000\n|1|1|0|0|0|0x01000000\n|1|1|0|0|1|0x02000000\n|1|1|0|1|0|0x04000000\n|1|1|0|1|1|0x08000000\n|1|1|1|0|0|0x10000000\n|1|1|1|0|1|0x20000000\n|1|1|1|1|0|0x40000000\n|1|1|1|1|1|0x80000000\n|===\n\n',
          seeAlso:
            "\n*and*(9),\n*logic*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in_0",
            name: "in-0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_1",
            name: "in-1",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_2",
            name: "in-2",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_3",
            name: "in-3",
            type: "bit",
            direction: "in",
          },
          {
            key: "in_4",
            name: "in-4",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "function",
            name: "function",
            type: "u32",
            direction: "rw",
          },
        ],
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
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component lut5 """Arbitrary 5-input logic function based on a look-up table""";\npin in bit in_0;\npin in bit in_1;\npin in bit in_2;\npin in bit in_3;\npin in bit in_4;\npin out bit out;\nparam rw u32 function;\nfunction _ nofp;\ndescription """\n*lut5*\nconstructs a logic function with up to 5 inputs using a **l**ook-**u**p **t**able.\nThe value for *function* can be determined by writing the truth table,\nand computing the sum of *all* the *weights* for which the output value would be *TRUE*.\nThe weights are hexadecimal not decimal so hexadecimal math must be used to sum the weights.\nA wiki page has a calculator to assist in computing the proper value for function.\n\nhttps://wiki.linuxcnc.org/cgi-bin/wiki.pl?Lut5\n\nNote that LUT5 will generate any of the 4,294,967,296\nlogical functions of 5 inputs so *AND*, *OR*, *NAND*,\n*NOR*, *XOR* and every other combinatorial function is possible.\n\n=== Example Functions\nA 5-input *and* function is TRUE only when all the inputs are true, so the\ncorrect value for *function* is *0x80000000*.\n\nA 2-input *or* function would be the sum of *0x2* + *0x4* + *0x8*, so the\ncorrect value for *function* is *0xe*.\n\nA 5-input *or* function is TRUE whenever any of the inputs are true, so the\ncorrect value for *function* is *0xfffffffe*. Because every weight except *0x1*\nis true the function is the sum of every line except the first one.\n\nA 2-input *xor* function is TRUE whenever exactly one of the inputs is true, so\nthe correct value for *function* is *0x6*.  Only *in-0* and *in-1* should be\nconnected to signals, because if any other bit is *TRUE* then the output will\nbe *FALSE*.\n\n[cols="^1,^1,^1,^1,^1,>1"]\n|===\n6+^h|Weights for each line of truth table\n\n^h|Bit 4\n^h|Bit 3\n^h|Bit 2\n^h|Bit 1\n^h|Bit 0\n2+^h|Weight\n\n|0|0|0|0|0|0x00000001\n|0|0|0|0|1|0x00000002\n|0|0|0|1|0|0x00000004\n|0|0|0|1|1|0x00000008\n|0|0|1|0|0|0x00000010\n|0|0|1|0|1|0x00000020\n|0|0|1|1|0|0x00000040\n|0|0|1|1|1|0x00000080\n|0|1|0|0|0|0x00000100\n|0|1|0|0|1|0x00000200\n|0|1|0|1|0|0x00000400\n|0|1|0|1|1|0x00000800\n|0|1|1|0|0|0x00001000\n|0|1|1|0|1|0x00002000\n|0|1|1|1|0|0x00004000\n|0|1|1|1|1|0x00008000\n|1|0|0|0|0|0x00010000\n|1|0|0|0|1|0x00020000\n|1|0|0|1|0|0x00040000\n|1|0|0|1|1|0x00080000\n|1|0|1|0|0|0x00100000\n|1|0|1|0|1|0x00200000\n|1|0|1|1|0|0x00400000\n|1|0|1|1|1|0x00800000\n|1|1|0|0|0|0x01000000\n|1|1|0|0|1|0x02000000\n|1|1|0|1|0|0x04000000\n|1|1|0|1|1|0x08000000\n|1|1|1|0|0|0x10000000\n|1|1|1|0|1|0x20000000\n|1|1|1|1|0|0x40000000\n|1|1|1|1|1|0x80000000\n|===\n\n""";\nsee_also """\n*and*(9),\n*logic*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
