// For all calls, take a look at the code for params

// All index files go here
//(.stft files still go in the same folder as .wavs)
FluidCorpusMap.indexFolder

// change (make sure it exists)
FluidCorpusMap.indexFolder = "~/Documents/SomeWhereElse/"

FluidCorpusMap.python
// path to python exe (change if needed, it probably will)
FluidCorpusMap.python = "/Users/username/anaconda/bin/python"

//test
FluidCorpusMap.python

// Segment a file using novelty

// omit folder path, get dialog, try parameters
FluidCorpusMap.segmentFile(kernelSize: 11, threshold:0.025)

// now run same and write to some folder
FluidCorpusMap.segmentFile(kernelSize: 11, threshold:0.25, destFolder:"/path_to_folder")


// Analyze a folder
// omit folder path, get dialog
//0 is MFCC, 1 is autoencoder
FluidCorpusMap.analyzeFolder(feature:1)



// Create Map
// omit path, get dialog
// navigate to ae.ds or mfcc.ds in the index folder
x = FluidCorpusMap.new

//map using different method
// 0 PCA
// 1 MDS
// 2 IsoMap
// 3 TSNE
// 4 SOM
// 5 FR (Graph)
x.map(3)

Server.default.options.numBuffers_(8192);
Server.default.boot;
x.loadBuffers;

// Scatterplot playmode
// 0: click
// 1: nearest (loop)
// 2: nearest (granular)
x.scatterplot(2)
