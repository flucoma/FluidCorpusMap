SynthDef(\granular, { |bufnum|
    var rate = 10;
	var dur = 8/rate;
	var imp = Impulse.ar(rate);
	var pos = 0.5*BufDur.kr(bufnum) +(0.2*Integrator.kr(BrownNoise.kr(0.001)));
	Out.ar(0,
		TGrains.ar(1, imp, bufnum, 1, pos, dur, 0, 0.1)!2)	
});
