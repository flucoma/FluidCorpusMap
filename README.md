FluidCorpusMap
--------------
FluidCorpusMap is a library for devising adaptive sound spaces using audio analysis and dimensionality reduction.
An interactive SuperCollider plot is provided which can be used to explore a collection of samples.
In addition, the resulting map can be exported to be used by several multi-touch web interfaces.
While the framework is implemented in SuperCollider, it requires Python for several operations, and some plug-ins from the
Fluid Decomposition toolbox (currently at beta testing stage).

For general information, please see out NIME paper
Gerard Roma, Owen Green, Pierre Alexandre Tremblay, "Adaptive Mapping of Sound Collections for Data-driven Musical Interfaces". Proceedings of NIME 2019.


# Install
Copy this folder to the SuperCollider Extensions folder. In addition, it is necessary to install a number of python libraries. For example, to create a conda environment:

```bash
conda create -n fcorpus2 python=3.6

conda install -n fcorpus2 pip

source activate fcorpus2

pip install -r requirements.txt
```

Also note that some new SuperCollider plug-ins are needed. These are part of the Fluid Decomposition Toolbox, which is currently beta. They are included as macOS binaries for the moment.

 Finally, for the web interfaces you will need node / npm. These are based on the supercolliderjs library.


# Using FluidCorpusMap
General usage is quite simple, see examples.scd. Pay attention to the path to your python executable and the location of index files.


# Using the web Interfaces
The included interfaces can be used to interact with a corpus generated by FluidCorpusMap. The index files will be located in FluidCorpusMap.indexFolder. The following files are relevant:
- filenames.ds contains the paths of the wav files in the corpus
- map.ds contains the low-dimensional coordinates corresponding to each file.

For example, to generate the scatterplot, a 4D space is used:

- Run `x = FluidCorpusMap.new("path_to/ae.ds", 2, 4)` in SuperCollider

- copy map.ds to fluid_corpus_server/src/client/js/scatterplot

- copy filenames.ds to fluid_corpus_server/src/server/scatterplot

- cd to  fluid_corpus_server and run: `npm install` and then `npm start`. Make sure that the SuperCollider server has started successfully.

- Finally, try it on a browser: http://localhost:3000/scatterplot.html

The interface expects multi-touch gestures, so a first thing to try is Chrome developer tools, then a tablet computer.
