SynthDef(\player,{|bufnum|
			 Out.ar(0,
				PlayBuf.ar(1, bufnum, BufRateScale.kr(bufnum), loop: 0)!2
             )
         });
