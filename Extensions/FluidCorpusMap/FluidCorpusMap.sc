FluidCorpusMap{

	classvar <>python = "python";
	classvar <>indexFolder = "~/Documents/FluidCorpusMap/";
	classvar aeSegmenter = "segment_ae.py";
	classvar aeExtractor = "extract_ae.py";
	classvar projector = "compute_projection.py";


	classvar mfccFilename = "mfcc.ds";
	classvar aeFilename = "ae.ds";
	classvar namesFilename = "filenames.ds";
	classvar mapFilename = "map.ds";

	var <indexPath, descriptorsFile, <fileNames, <descriptors, <positions;
	var <server, <buffers, <maxBufFrames;
	var <nDimensions, <maxima, <minima;
	var <currentMapping = 3, <currentFeature = 0;
	var tree;

	*initClass {
		var classPath = File.realpath(FluidCorpusMap.class.filenameSymbol)
						.dirname.withTrailingSlash;
		aeExtractor = (classPath +/+ aeExtractor).quote;
		projector = (classPath +/+ projector).quote;
        aeSegmenter = (classPath +/+ aeSegmenter).quote;
    }

	*analyzeFolder{|folderName = nil, feature = 0, doneAction = nil|
		if (folderName.isNil){
			FileDialog({ |path|
				FluidCorpusMap.analyzeFolder(path[0], feature, doneAction);
			}, fileMode:2);
		}{
			(indexFolder+/+PathName(folderName).fileName).resolveRelative.mkdir;
			if (feature == 0)
				{FluidCorpusMap.analyzeMFCC(folderName, doneAction)}
				{FluidCorpusMap.analyzeAE(folderName, doneAction)}
		};
	}

	*analyzeMFCC{|folderName, doneAction, aServer = nil|
		var descriptors, fileNames, wavFiles;
		var indexPath, namesFile;
        var tmpServer = aServer ? Server.default;
        var tmpFeatures = Buffer.new(tmpServer);
        var tmpStats = Buffer.new(tmpServer);
		wavFiles = (folderName +/+ "*.wav").pathMatch;
        if(tmpServer.hasBooted.not){"WARNING: server not running".postln};
        Routine{
            wavFiles.do {|f, i|
                var feat = FloatArray();
                var buf = Buffer.readChannel(tmpServer,f,channels:[0],action: {|b|
                    FluidBufMFCC.process(tmpServer,b, features: tmpFeatures);
                });
                tmpServer.sync;
                FluidBufStats.process(tmpServer,tmpFeatures,stats:tmpStats, numDerivs: 1);
                tmpServer.sync;
                tmpStats.loadToFloatArray(action: {|a|
                    Array2D.fromArray(13,a.size / 13,a).colsDo{|c,i|
                        //Discard skew, kurtosis and median + their derivatives (cols 2,3,5,9,10,12)
                        if([2,3,5,9,10,12].indexOf(i.asInt).isNil) { feat=feat.addAll(c);};
                    };
                });
                descriptors = descriptors.add(feat);
                fileNames = fileNames.add(f);
                buf.free;
                ("Analyzing "+(i+1)+" of "+wavFiles.size).postln;
            };
            tmpServer.sync;
            indexPath = (indexFolder+/+PathName(folderName)
                .fileName).standardizePath;
            "Writing index files to %s".format(indexPath).postln;
            namesFile = File(indexPath +/+ namesFilename,"w");
            fileNames.do{|name| namesFile.write(name++"\n")};
            namesFile.close;
            descriptors.writeFile(indexPath +/+ mfccFilename);
            tmpFeatures.free;
            tmpStats.free;
            "done".postln;
            doneAction.value;
        }.play;
	}

	*analyzeAE{|folderName, doneAction|
		var descriptors, fileNames, wavFiles;
		var indexPath, namesFile;
		var result;
		fileNames = (folderName +/+ "*.wav").pathMatch;
		indexPath = (indexFolder+/+PathName(folderName)
					.fileName).standardizePath;
		namesFile = File(indexPath +/+ namesFilename,"w");
		fileNames.do{|name| namesFile.write(name++"\n")};
		namesFile.close;

		"Training AE".postln;
		result = (python + aeExtractor +
			(indexPath +/+ namesFilename).quote +
			(indexPath +/+ aeFilename).quote).postln.systemCmd;
		result.postln;
		if(result==0){"done".postln;}{"Error in AE extraction".postln};

		doneAction.value;
	}

    //feature 0 = Novelty + STFT; feature 1= Novelty + AutoEncoder
	*segmentFile{|fileName, kernelSize = 3, threshold = 0.5, filterSize=13, destFolder = nil, feature = 0,
		doneAction = nil, aServer = nil|

		if (fileName.isNil){
			FileDialog{ |path|
				FluidCorpusMap.segmentFile(
					path[0], kernelSize, threshold, filterSize, destFolder, doneAction, aServer);
			};
		}{
			var tmpServer = aServer ? Server.default;
			var slicesBuffer = Buffer.new(tmpServer);
			var audioBuffer;
            if(tmpServer.hasBooted.not){"Warning: server not running".postln};
            if(feature == 0)
            {

                Routine{
                    "Loading...".postln;
                    audioBuffer = Buffer.read(tmpServer, fileName, action:{|b|
                        "Analyzing...".postln;
                        FluidBufNoveltySlice.process(
                            tmpServer,
                            srcBufNum: b.bufnum,
                            transBufNum: slicesBuffer.bufnum,
                            kernelSize:kernelSize,
                            thresh: threshold,
                            filterSize: filterSize
                        );
                    });
                    tmpServer.sync;
                    slicesBuffer.loadToFloatArray(action:{|arr|
                        "Number of slices: %".format(arr.size).postln;
                        if(destFolder.notNil){
                            var nSegments = arr.size - 1;
                            "Writing files...".postln;
                            nSegments.do{|i|
                                audioBuffer.write(
                                    destFolder+/+i.asString++".wav",
                                    "wav", "int16", arr[i+1]-arr[i], arr[i]
                            )};
                            "Done!".postln;
                        }
                    });
                    doneAction.value;
                }.play;
            }
            {
                this.prSegmentExternal(fileName,destFolder,kernelSize,doneAction:doneAction,aServer:tmpServer);
            }
		}
	}

    *prSegmentExternal{ |fileName, destFolder, kernelSize=64, iterations=10,
        doneAction = nil,aServer = nil|

        Routine{
            var audioBuffer;
            var indexPath, namesFile;
            var result;
            var slices, sliceFile;

            "Training AE and Segmenting".postln;
            result = (python + aeSegmenter +
                fileName.quote +
                indexFolder.quote + kernelSize + iterations).postln.systemCmd;
            // result.postln;
            if(result!=0){"Error in AE extraction".postln; ^nil};

            sliceFile = indexFolder +/+ fileName.basename ++ '.ae_segs.ds';
            slices = Array.newFromFile(sliceFile).flatten.asFloat;

            if(aServer.notNil)
            {
                if(destFolder.notNil)
                {
                    audioBuffer = Buffer.read(aServer, fileName);
                    aServer.sync;
                    slices = [0] ++ slices ++ [(audioBuffer.numFrames-1)/512];
                    "Writing files...".postln;
                    Array2D.fromArray(slices.size - 1,2, slices.slide(2,1)).rowsDo{|x,i|
                        audioBuffer.write(
                            destFolder+/+i.asString++".wav","wav","int16",
                            (x[1].asInt-x[0].asInt)*512,x[0].asInt * 512);
                    };
                    audioBuffer.free;
                }{("No destination folder, not writing new files. Slice indices can be found at " + sliceFile).postln;};
                "done".postln;
            } {"Server not running".postln;};
        }.play;
        doneAction.value;
    }



	*new{|fileName, mapping = 0, d = 2, doneAction, server|
		^super.new.init(fileName, mapping, d, doneAction, server)
	}



	initMap{|fileName, mapping, doneAction|
		descriptorsFile = fileName;
		indexPath = fileName.dirname;
		descriptors = Array.newFromFile(descriptorsFile).asFloat;
		this.map(mapping);
		this.makeTree(positions);
		this.computeStats;
	}
	init{|fileName, mapping, d, doneAction, aServer|
		server = aServer ? Server.default;
		nDimensions = d;
		if (fileName.isNil){
			FileDialog({ |path| this.initMap(path[0], mapping,  doneAction)})
		}{
			this.initMap(fileName, mapping, doneAction)
		}
	}

	map{|num|
		var result = (python + projector + descriptorsFile.quote + num + nDimensions).postln.systemCmd;
		result.postln;
		if(result==0){"Map creation OK".postln}{"Error creating map".postln};
		positions = Array.newFromFile(indexPath +/+ mapFilename).asFloat;
		this.makeTree(positions);
		this.computeStats;
		^this;
	}

	scatterplot{|playMode = 0|
		if(buffers.size > 0){
			FluidCorpusScatterPlot.new(this, playMode).draw;
		}{
			"Warning: no buffers loaded".postln;
		}

	}

	makeTree{|dec|
		var treeData = dec.collect{|x,i| x++[i]};
		tree = KDTree(treeData, lastIsLabel: true);
		^tree;
	}

	nearest{|x,y|
		var node = tree.nearest([x,y]);
		^node[0].label;
	}

	radius{|x,y, r|
		var result = nil;
		var node = tree.radiusSearch([x,y], r);
		if (node.notNil && node[0].notNil) {result = node[0].label};
		^result;
	}

	computeStats{
		var vals = nDimensions.collect{|i| positions.collect{|point| point[i]}};
		minima = vals.collect{|v| v.minItem};
		maxima = vals.collect{|v| v.maxItem};
	}

	loadBuffers {|doneAction|
		//TODO: read from filenames file
		var namesFile =  File(indexPath +/+ namesFilename,"r");
		if(server.hasBooted.not){"Warning: server not running".postln};
		fileNames = namesFile.readAllString.split(Char.nl);
        if(fileNames.last.size == 0) {fileNames.pop;};
		buffers = [];
		maxBufFrames = 0;
		Routine{
			fileNames.do{|f, i|
                if(f.notNil && f.size > 0)
                {
                    var b = Buffer.read(server, f);
                    server.sync;
                    if (b.numFrames.notNil){
                        if (b.numFrames > maxBufFrames) {maxBufFrames = b.numFrames};
                        buffers = buffers.add(b);
                        ("Loaded"+(i+1)+"of"+fileNames.size).postln;
                    }
                }
			};
			"Loading buffers done".postln;
			doneAction.value;
		}.play;
	}
}
