import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "bldc_hall3",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:bldc-hall3:bldc-hall3",
        name: "bldc_hall3",
        halComponentName: "bldc_hall3",
        source: "comp",
        sourcePath: "src/hal/components/bldc_hall3.comp",
        docs: {
          component:
            '3-wire BLDC motor driver using Hall sensors and trapezoidal commutation.\nThe functionality of this component is now included in the generic "bldc" \ncomponent. This component is likely to be removed in a future release',
          description:
            "\nThis component produces a 3-wire bipolar output. This suits upstream drivers \nthat interpret a negative input as a low-side drive and positive as a high-side \ndrive. This includes the Hostmot2 3pwmgen function, which is likely to be the \nmost common application of this component. \n",
          seeAlso: "\nbldc_hall6 6-wire unipolar driver for BLDC motors.\n",
          license: "GPL",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "hall1",
            name: "hall1",
            type: "bit",
            doc: "Hall sensor signal 1",
            direction: "in",
          },
          {
            key: "hall2",
            name: "hall2",
            type: "bit",
            doc: "Hall sensor signal 2",
            direction: "in",
          },
          {
            key: "hall3",
            name: "hall3",
            type: "bit",
            doc: "Hall sensor signal 3",
            direction: "in",
          },
          {
            key: "value",
            name: "value",
            type: "float",
            doc: "PWM master amplitude input",
            direction: "in",
          },
          {
            key: "dir",
            name: "dir",
            type: "bit",
            doc: "Forwards / reverse selection. Negative PWM amplitudes will also \nreverse the motor and there will generally be a pattern that runs the motor in\neach direction too.",
            direction: "in",
          },
          {
            key: "A_value",
            name: "A-value",
            type: "float",
            doc: "Output amplitude for phase A",
            direction: "out",
          },
          {
            key: "B_value",
            name: "B-value",
            type: "float",
            doc: "Output amplitude for phase B",
            direction: "out",
          },
          {
            key: "C_value",
            name: "C-value",
            type: "float",
            doc: "Output amplitude for phase C",
            direction: "out",
          },
        ],
        params: [
          {
            key: "pattern",
            name: "pattern",
            type: "u32",
            doc: 'Commutation pattern to use, from 0 to 47. Default is type 25.\nEvery plausible combination is included. The table shows the excitation pattern\nalong the top, and the pattern code on the left hand side. The table entries\nare the hall patterns in H1, H2, H3 order. \nCommon patterns are:\n0 (30 degree commutation) and 26, its reverse. \n17 (120 degree).\n18 (alternate 60 degree).\n21 (300 degree, Bodine).\n22 (240 degree).\n25 (60 degree commutation).\n\nNote that a number of incorrect commutations will have non-zero net torque \nwhich might look as if they work, but don\'t really. \n\nIf your motor lacks documentation it might be worth trying every pattern. \n\n.ie \'\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#pattern TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#pattern TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#pattern TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="pattern" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n<COL SPAN=7 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR><TD>&nbsp;<TH COLSPAN=6 CLASS=W>Phases, Source - Sink \\\\\n<TR><TH CLASS=W>pat<TH CLASS=W>B-A<TH CLASS=W>C-A<TH CLASS=W>C-B<TH CLASS=W>A-B<TH CLASS=W>A-C<TH CLASS=W>B-C \\\\\n<TR><TH>0<TD>000<TD>001<TD>011<TD>111<TD>110<TD>100 \\\\\n<TR><TH>1<TD>001<TD>000<TD>010<TD>110<TD>111<TD>101 \\\\\n<TR><TH>2<TD>000<TD>010<TD>011<TD>111<TD>101<TD>100 \\\\\n<TR><TH>3<TD>001<TD>011<TD>010<TD>110<TD>100<TD>101 \\\\\n<TR><TH>4<TD>010<TD>011<TD>001<TD>101<TD>100<TD>110 \\\\\n<TR><TH>5<TD>011<TD>010<TD>000<TD>100<TD>101<TD>111 \\\\\n<TR><TH>6<TD>010<TD>000<TD>001<TD>101<TD>111<TD>110 \\\\\n<TR><TH>7<TD>011<TD>001<TD>000<TD>100<TD>110<TD>111 \\\\\n<TR><TH>8<TD>000<TD>001<TD>101<TD>111<TD>110<TD>010 \\\\\n<TR><TH>9<TD>001<TD>000<TD>100<TD>110<TD>111<TD>011 \\\\\n<TR><TH>10<TD>000<TD>010<TD>110<TD>111<TD>101<TD>001 \\\\\n<TR><TH>11<TD>001<TD>011<TD>111<TD>110<TD>100<TD>000 \\\\\n<TR><TH>12<TD>010<TD>011<TD>111<TD>101<TD>100<TD>000 \\\\\n<TR><TH>13<TD>011<TD>010<TD>110<TD>100<TD>101<TD>001 \\\\\n<TR><TH>14<TD>010<TD>000<TD>100<TD>101<TD>111<TD>011 \\\\\n<TR><TH>15<TD>011<TD>001<TD>101<TD>100<TD>110<TD>010 \\\\\n<TR><TH>16<TD>000<TD>100<TD>101<TD>111<TD>011<TD>010 \\\\\n<TR><TH>17<TD>001<TD>101<TD>100<TD>110<TD>010<TD>011 \\\\\n<TR><TH>18<TD>000<TD>100<TD>110<TD>111<TD>011<TD>001 \\\\\n<TR><TH>19<TD>001<TD>101<TD>111<TD>110<TD>010<TD>000 \\\\\n<TR><TH>20<TD>010<TD>110<TD>111<TD>101<TD>001<TD>000 \\\\\n<TR><TH>21<TD>011<TD>111<TD>110<TD>100<TD>000<TD>001 \\\\\n<TR><TH>22<TD>010<TD>110<TD>100<TD>101<TD>001<TD>011 \\\\\n<TR><TH>23<TD>011<TD>111<TD>101<TD>100<TD>000<TD>010 \\\\\n<TR><TH>24<TD>100<TD>101<TD>111<TD>011<TD>010<TD>000 \\\\\n<TR><TH>25<TD>101<TD>100<TD>110<TD>010<TD>011<TD>001 \\\\\n<TR><TH>26<TD>100<TD>110<TD>111<TD>011<TD>001<TD>000 \\\\\n<TR><TH>27<TD>101<TD>111<TD>110<TD>010<TD>000<TD>001 \\\\\n<TR><TH>28<TD>110<TD>111<TD>101<TD>001<TD>000<TD>010 \\\\\n<TR><TH>29<TD>111<TD>110<TD>100<TD>000<TD>001<TD>011 \\\\\n<TR><TH>30<TD>110<TD>100<TD>101<TD>001<TD>011<TD>010 \\\\\n<TR><TH>31<TD>111<TD>101<TD>100<TD>000<TD>010<TD>011 \\\\\n<TR><TH>32<TD>100<TD>101<TD>001<TD>011<TD>010<TD>110 \\\\\n<TR><TH>33<TD>101<TD>100<TD>000<TD>010<TD>011<TD>111 \\\\\n<TR><TH>34<TD>100<TD>110<TD>010<TD>011<TD>001<TD>101 \\\\\n<TR><TH>35<TD>101<TD>111<TD>011<TD>010<TD>000<TD>100 \\\\\n<TR><TH>36<TD>110<TD>111<TD>011<TD>001<TD>000<TD>100 \\\\\n<TR><TH>37<TD>111<TD>110<TD>010<TD>000<TD>001<TD>101 \\\\\n<TR><TH>38<TD>110<TD>100<TD>000<TD>001<TD>011<TD>111 \\\\\n<TR><TH>39<TD>111<TD>101<TD>001<TD>000<TD>010<TD>110 \\\\\n<TR><TH>40<TD>100<TD>000<TD>001<TD>011<TD>111<TD>110 \\\\\n<TR><TH>41<TD>101<TD>001<TD>000<TD>010<TD>110<TD>111 \\\\\n<TR><TH>42<TD>100<TD>000<TD>010<TD>011<TD>111<TD>101 \\\\\n<TR><TH>43<TD>101<TD>001<TD>011<TD>010<TD>110<TD>100 \\\\\n<TR><TH>44<TD>110<TD>010<TD>011<TD>001<TD>101<TD>100 \\\\\n<TR><TH>45<TD>111<TD>011<TD>010<TD>000<TD>100<TD>101 \\\\\n<TR><TH>46<TD>110<TD>010<TD>000<TD>001<TD>101<TD>111 \\\\\n<TR><TH>47<TD>111<TD>011<TD>001<TD>000<TD>100<TD>110 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n\n.TS\nbox tab(;);\ncb s s s s s s\ncb|cb cb cb cb cb cb\nc | c  c  c  c c r.\nPhases, Source - Sink\n_\npat;B-A;C-A;C-B;A-B;A-C;B-C\n_\n0;000;001;011;111;110;100\n1;001;000;010;110;111;101\n2;000;010;011;111;101;100\n3;001;011;010;110;100;101\n4;010;011;001;101;100;110\n5;011;010;000;100;101;111\n6;010;000;001;101;111;110\n7;011;001;000;100;110;111\n8;000;001;101;111;110;010\n9;001;000;100;110;111;011\n10;000;010;110;111;101;001\n11;001;011;111;110;100;000\n12;010;011;111;101;100;000\n13;011;010;110;100;101;001\n14;010;000;100;101;111;011\n15;011;001;101;100;110;010\n16;000;100;101;111;011;010\n17;001;101;100;110;010;011\n18;000;100;110;111;011;001\n19;001;101;111;110;010;000\n20;010;110;111;101;001;000\n21;011;111;110;100;000;001\n22;010;110;100;101;001;011\n23;011;111;101;100;000;010\n24;100;101;111;011;010;000\n25;101;100;110;010;011;001\n26;100;110;111;011;001;000\n27;101;111;110;010;000;001\n28;110;111;101;001;000;010\n29;111;110;100;000;001;011\n30;110;100;101;001;011;010\n31;111;101;100;000;010;011\n32;100;101;001;011;010;110\n33;101;100;000;010;011;111\n34;100;110;010;011;001;101\n35;101;111;011;010;000;100\n36;110;111;011;001;000;100\n37;111;110;010;000;001;101\n38;110;100;000;001;011;111\n39;111;101;001;000;010;110\n40;100;000;001;011;111;110\n41;101;001;000;010;110;111\n42;100;000;010;011;111;101\n43;101;001;011;010;110;100\n44;110;010;011;001;101;100\n45;111;011;010;000;100;101\n46;110;010;000;001;101;111\n47;111;011;001;000;100;110\n.TE\n\\\\}\n',
            defaultValue: "25",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
            doc: "Interpret Hall sensor patterns and set 3-phase amplitudes",
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
            'component bldc_hall3 \n"""3-wire BLDC motor driver using Hall sensors and trapezoidal commutation.\nThe functionality of this component is now included in the generic "bldc" \ncomponent. This component is likely to be removed in a future release""";\n\npin in bit hall1 "Hall sensor signal 1";\npin in bit hall2 "Hall sensor signal 2";\npin in bit hall3 "Hall sensor signal 3";\npin in float value "PWM master amplitude input";\npin in bit dir \n"""Forwards / reverse selection. Negative PWM amplitudes will also \nreverse the motor and there will generally be a pattern that runs the motor in\neach direction too.""";\n\npin out float A-value "Output amplitude for phase A";\npin out float B-value "Output amplitude for phase B";\npin out float C-value "Output amplitude for phase C";\n\nparam rw unsigned pattern=25\n"""Commutation pattern to use, from 0 to 47. Default is type 25.\nEvery plausible combination is included. The table shows the excitation pattern\nalong the top, and the pattern code on the left hand side. The table entries\nare the hall patterns in H1, H2, H3 order. \nCommon patterns are:\n0 (30 degree commutation) and 26, its reverse. \n17 (120 degree).\n18 (alternate 60 degree).\n21 (300 degree, Bodine).\n22 (240 degree).\n25 (60 degree commutation).\n\nNote that a number of incorrect commutations will have non-zero net torque \nwhich might look as if they work, but don\'t really. \n\nIf your motor lacks documentation it might be worth trying every pattern. \n\n.ie \'\\*[.T]\'html\' \\\\{\\\\\n.HTML \\\\\n<STYLE> \\\\\n#pattern TD { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#pattern TH { text-align: center; padding-left: .5ex; padding-right: .5ex } \\\\\n#pattern TD.W { text-align: right; } \\\\\n</STYLE> \\\\\n<TABLE ID="pattern" STYLE="border: 1px solid black; border-collapse: collapse"> \\\\\n<COL SPAN=7 STYLE="margin: .2ex"><COL SPAN=1 STYLE="border-left: 1px solid black"> \\\\\n<TR><TD>&nbsp;<TH COLSPAN=6 CLASS=W>Phases, Source - Sink \\\\\n<TR><TH CLASS=W>pat<TH CLASS=W>B-A<TH CLASS=W>C-A<TH CLASS=W>C-B<TH CLASS=W>A-B<TH CLASS=W>A-C<TH CLASS=W>B-C \\\\\n<TR><TH>0<TD>000<TD>001<TD>011<TD>111<TD>110<TD>100 \\\\\n<TR><TH>1<TD>001<TD>000<TD>010<TD>110<TD>111<TD>101 \\\\\n<TR><TH>2<TD>000<TD>010<TD>011<TD>111<TD>101<TD>100 \\\\\n<TR><TH>3<TD>001<TD>011<TD>010<TD>110<TD>100<TD>101 \\\\\n<TR><TH>4<TD>010<TD>011<TD>001<TD>101<TD>100<TD>110 \\\\\n<TR><TH>5<TD>011<TD>010<TD>000<TD>100<TD>101<TD>111 \\\\\n<TR><TH>6<TD>010<TD>000<TD>001<TD>101<TD>111<TD>110 \\\\\n<TR><TH>7<TD>011<TD>001<TD>000<TD>100<TD>110<TD>111 \\\\\n<TR><TH>8<TD>000<TD>001<TD>101<TD>111<TD>110<TD>010 \\\\\n<TR><TH>9<TD>001<TD>000<TD>100<TD>110<TD>111<TD>011 \\\\\n<TR><TH>10<TD>000<TD>010<TD>110<TD>111<TD>101<TD>001 \\\\\n<TR><TH>11<TD>001<TD>011<TD>111<TD>110<TD>100<TD>000 \\\\\n<TR><TH>12<TD>010<TD>011<TD>111<TD>101<TD>100<TD>000 \\\\\n<TR><TH>13<TD>011<TD>010<TD>110<TD>100<TD>101<TD>001 \\\\\n<TR><TH>14<TD>010<TD>000<TD>100<TD>101<TD>111<TD>011 \\\\\n<TR><TH>15<TD>011<TD>001<TD>101<TD>100<TD>110<TD>010 \\\\\n<TR><TH>16<TD>000<TD>100<TD>101<TD>111<TD>011<TD>010 \\\\\n<TR><TH>17<TD>001<TD>101<TD>100<TD>110<TD>010<TD>011 \\\\\n<TR><TH>18<TD>000<TD>100<TD>110<TD>111<TD>011<TD>001 \\\\\n<TR><TH>19<TD>001<TD>101<TD>111<TD>110<TD>010<TD>000 \\\\\n<TR><TH>20<TD>010<TD>110<TD>111<TD>101<TD>001<TD>000 \\\\\n<TR><TH>21<TD>011<TD>111<TD>110<TD>100<TD>000<TD>001 \\\\\n<TR><TH>22<TD>010<TD>110<TD>100<TD>101<TD>001<TD>011 \\\\\n<TR><TH>23<TD>011<TD>111<TD>101<TD>100<TD>000<TD>010 \\\\\n<TR><TH>24<TD>100<TD>101<TD>111<TD>011<TD>010<TD>000 \\\\\n<TR><TH>25<TD>101<TD>100<TD>110<TD>010<TD>011<TD>001 \\\\\n<TR><TH>26<TD>100<TD>110<TD>111<TD>011<TD>001<TD>000 \\\\\n<TR><TH>27<TD>101<TD>111<TD>110<TD>010<TD>000<TD>001 \\\\\n<TR><TH>28<TD>110<TD>111<TD>101<TD>001<TD>000<TD>010 \\\\\n<TR><TH>29<TD>111<TD>110<TD>100<TD>000<TD>001<TD>011 \\\\\n<TR><TH>30<TD>110<TD>100<TD>101<TD>001<TD>011<TD>010 \\\\\n<TR><TH>31<TD>111<TD>101<TD>100<TD>000<TD>010<TD>011 \\\\\n<TR><TH>32<TD>100<TD>101<TD>001<TD>011<TD>010<TD>110 \\\\\n<TR><TH>33<TD>101<TD>100<TD>000<TD>010<TD>011<TD>111 \\\\\n<TR><TH>34<TD>100<TD>110<TD>010<TD>011<TD>001<TD>101 \\\\\n<TR><TH>35<TD>101<TD>111<TD>011<TD>010<TD>000<TD>100 \\\\\n<TR><TH>36<TD>110<TD>111<TD>011<TD>001<TD>000<TD>100 \\\\\n<TR><TH>37<TD>111<TD>110<TD>010<TD>000<TD>001<TD>101 \\\\\n<TR><TH>38<TD>110<TD>100<TD>000<TD>001<TD>011<TD>111 \\\\\n<TR><TH>39<TD>111<TD>101<TD>001<TD>000<TD>010<TD>110 \\\\\n<TR><TH>40<TD>100<TD>000<TD>001<TD>011<TD>111<TD>110 \\\\\n<TR><TH>41<TD>101<TD>001<TD>000<TD>010<TD>110<TD>111 \\\\\n<TR><TH>42<TD>100<TD>000<TD>010<TD>011<TD>111<TD>101 \\\\\n<TR><TH>43<TD>101<TD>001<TD>011<TD>010<TD>110<TD>100 \\\\\n<TR><TH>44<TD>110<TD>010<TD>011<TD>001<TD>101<TD>100 \\\\\n<TR><TH>45<TD>111<TD>011<TD>010<TD>000<TD>100<TD>101 \\\\\n<TR><TH>46<TD>110<TD>010<TD>000<TD>001<TD>101<TD>111 \\\\\n<TR><TH>47<TD>111<TD>011<TD>001<TD>000<TD>100<TD>110 \\\\\n</TABLE>\n\\\\}\n.el \\\\{\\\\\n\n.TS\nbox tab(;);\ncb s s s s s s\ncb|cb cb cb cb cb cb\nc | c  c  c  c c r.\nPhases, Source - Sink\n_\npat;B-A;C-A;C-B;A-B;A-C;B-C\n_\n0;000;001;011;111;110;100\n1;001;000;010;110;111;101\n2;000;010;011;111;101;100\n3;001;011;010;110;100;101\n4;010;011;001;101;100;110\n5;011;010;000;100;101;111\n6;010;000;001;101;111;110\n7;011;001;000;100;110;111\n8;000;001;101;111;110;010\n9;001;000;100;110;111;011\n10;000;010;110;111;101;001\n11;001;011;111;110;100;000\n12;010;011;111;101;100;000\n13;011;010;110;100;101;001\n14;010;000;100;101;111;011\n15;011;001;101;100;110;010\n16;000;100;101;111;011;010\n17;001;101;100;110;010;011\n18;000;100;110;111;011;001\n19;001;101;111;110;010;000\n20;010;110;111;101;001;000\n21;011;111;110;100;000;001\n22;010;110;100;101;001;011\n23;011;111;101;100;000;010\n24;100;101;111;011;010;000\n25;101;100;110;010;011;001\n26;100;110;111;011;001;000\n27;101;111;110;010;000;001\n28;110;111;101;001;000;010\n29;111;110;100;000;001;011\n30;110;100;101;001;011;010\n31;111;101;100;000;010;011\n32;100;101;001;011;010;110\n33;101;100;000;010;011;111\n34;100;110;010;011;001;101\n35;101;111;011;010;000;100\n36;110;111;011;001;000;100\n37;111;110;010;000;001;101\n38;110;100;000;001;011;111\n39;111;101;001;000;010;110\n40;100;000;001;011;111;110\n41;101;001;000;010;110;111\n42;100;000;010;011;111;101\n43;101;001;011;010;110;100\n44;110;010;011;001;101;100\n45;111;011;010;000;100;101\n46;110;010;000;001;101;111\n47;111;011;001;000;100;110\n.TE\n\\\\}\n""";\n\ndescription """\nThis component produces a 3-wire bipolar output. This suits upstream drivers \nthat interpret a negative input as a low-side drive and positive as a high-side \ndrive. This includes the Hostmot2 3pwmgen function, which is likely to be the \nmost common application of this component. \n""";\n\nsee_also """\nbldc_hall6 6-wire unipolar driver for BLDC motors.\n""";\n\nlicense "GPL";\n\nauthor "Andy Pugh";\n\nfunction _ "Interpret Hall sensor patterns and set 3-phase amplitudes";\n\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: null,
    },
  ],
};

export default history;
