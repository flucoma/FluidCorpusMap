FluidCorpusScatterPlot{
	var window, plotView, infoText;
	var synthDefs, synth;
	var specs, plotSpecs, sizeSpec;
	var map, points;
	var minPointSize = 5, maxPointSize = 25;
	var selStart, selEnd, selBounds, zoomBounds;
	var playMode = 0, playing;

	*new{|aMap, mode = 0|
		^super.new.init(aMap, mode)
	}

	*initClass {

	}

	init {|aMap, mode|
		map = aMap;
		window = Window.new("", Rect(0,0,520,550)).front;
		window.acceptsMouseOver_(true);
		this.initPlotView;
		zoomBounds = plotView.bounds;
		Routine{
			this.initSynthDefs;
			map.server.sync;
			this.setPlayMode(mode);
		}.play;
		infoText = StaticText(window, Rect(10, 10, 200, 20));
		infoText.string_("No sounds");
		infoText.resize_(7);

		window.layout_(
			HLayout(
				[nil, s:1],
				[VLayout(
					[plotView,  s:2],
					[infoText]
				), s:20],
				[nil, s:1]
			)
		);
	}

	mapPoint{|p|
		var x = (p.x - zoomBounds.left) * (plotView.bounds.width / zoomBounds.width);
		var y = (p.y - zoomBounds.top) * (plotView.bounds.height / zoomBounds.height);
		^(x@y);
	}

	unMapPoint{|p|
		var x = (p.x / (plotView.bounds.width / zoomBounds.width)) + zoomBounds.left;
		var y = (p.y / (plotView.bounds.height / zoomBounds.height)) + zoomBounds.top;
		^(x@y);
	}

	initPlotView{
		plotView = UserView.new(window, Rect(50,50,500,500));
		plotView.background_(Color.black);
		plotView.minSize_(500@500);
		plotView.resize_(5);
		plotView.drawFunc = {
			points.do{|pos, i|
				var point = this.mapPoint(pos[0]@pos[1]);
				var size = pos[2];
				var off = size / 2;
				if(i==playing){
					Pen.fillColor = Color.white
				}{
					Pen.fillColor = Color.new(0,0,1,0.7);
				};

				Pen.strokeColor = Color.white;
				Pen.addOval(Rect(point.x - off, point.y - off, size, size));
				Pen.fill;
			};
			if (selBounds.notNil){
				Pen.fillColor = Color.new(1,1,1,0.5);
				Pen.addRect(selBounds);
				Pen.fill;
			}
		};

		plotView.mouseDownAction_{|v, x, y, mod, b, clicks|
			if(clicks == 2){
				this.draw;
			}{
				if (mod & 524288 == 524288) {
					selStart = [x,y];
				}{
					selStart = nil;
					if(playMode == 0){this.playSound(this.unMapPoint(x@y))};
				}
			}
		};

		plotView.mouseUpAction_{|v, x, y, mod|
			if (mod & 524288 == 524288) {
				selEnd = [x,y];
				if(selBounds.notNil){zoomBounds = selBounds};
			};
			selStart = nil;
			selEnd = nil;
			selBounds = nil;
			plotView.refresh;
		};

		plotView.mouseMoveAction_{|v, x, y, mod|
		  if(selStart.notNil){
				selBounds = Rect(
						selStart[0], selStart[1],
						x - selStart[0],y - selStart[1]
				);
		  };
		  plotView.refresh;
		};

		plotView.mouseOverAction_{|v, x, y, mod|
		  if(playMode > 0){
				var nearest = this.getNearest(this.unMapPoint(x@y));
				synth.set(\bufnum, map.buffers[nearest]);
				playing = nearest;
		  };
		  plotView.refresh;
		}
	}

	getNearest{|p|
		var original = [
			specs[0].map(plotSpecs[0].unmap(p.x)),
			specs[1].map(plotSpecs[1].unmap(p.y))
		];
		^map.nearest(original[0], original[1]);
	}

	playSound{|p|
		var nearest = this.getNearest(p);
		var pos = points[nearest];
		if((abs(pos[0] - p.x) < pos[2]) && (abs(pos[1] - p.y) < pos[2])){
			if(synth.notNil){synth.free};
			synth = Synth(synthDefs[0], [\bufnum, map.buffers[nearest].bufnum]);
			playing = nearest;
		}{
			if(synth.notNil){synth.free};
			playing = nil;
		}
	}

	initSynthDefs{
		var oneShot = SynthDef(\shot,{|bufnum|
			 Out.ar(0,
				PlayBuf.ar(1, bufnum, BufRateScale.kr(bufnum), doneAction: Done.freeSelf)!2
			)
		}).add;
		var loop = SynthDef(\loop,{|bufnum|
			 Out.ar(0,
				PlayBuf.ar(1, bufnum, BufRateScale.kr(bufnum), loop: 1.0)!2
			)
		}).add;
		var grains = SynthDef(\grains, { |bufnum|
			var rate = 10;
			var dur = 8/rate;
			var imp = Impulse.ar(rate);
			var pos = 0.5*BufDur.kr(bufnum) +(0.2*Integrator.kr(BrownNoise.kr(0.001)));
			Out.ar(0,
				TGrains.ar(1, imp, bufnum, 1, pos, dur, 0, 0.1)!2)
		 }).add;
		synthDefs = [\shot, \loop, \grains];
	}

	setPlayMode{|mode|
		playMode = mode;
		if(synth.notNil){synth.free};
		if (mode > 0){
		    synth = Synth(synthDefs[mode], [\bufnum, 0])
		}
	}

	draw {
		defer{
			infoText.string_("Rendering");
			this.makeSpecs;
			this.renderPoints;
			zoomBounds = plotView.bounds;
			plotView.refresh;
			infoText.string_("Ready");
		}
	}

	makeSpecs {
		specs = map.nDimensions.collect{|i|
			ControlSpec(map.minima[i], map.maxima[i])
		};
		plotSpecs = [
			ControlSpec(0, plotView.bounds.width),
			ControlSpec(0, plotView.bounds.height)
		];
		sizeSpec = ControlSpec(minPointSize, maxPointSize);
	}

	renderPoints {
		points = map.positions.collect{|vec, i|
			[plotSpecs[0].map(specs[0].unmap(vec[0])),
			 plotSpecs[1].map(specs[1].unmap(vec[1])),
			 sizeSpec.map(map.buffers[i].numFrames / map.maxBufFrames)
			]
		};
	}
}
