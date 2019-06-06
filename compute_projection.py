import sys, os
import numpy as np
from sklearn import  (manifold, decomposition, discriminant_analysis)
from minisom import MiniSom
from sklearn.neighbors import NearestNeighbors
from sklearn.neighbors import LocalOutlierFactor
import networkx as nx

algorithms = [
    decomposition.TruncatedSVD,
    manifold.MDS,
    manifold.Isomap,
    manifold.LocallyLinearEmbedding,
    manifold.TSNE
]

fname = sys.argv[1]
algorithm = int(sys.argv[2])
n_comps = int(sys.argv[3])

x = np.loadtxt(fname)

if algorithm == 0:
    model = decomposition.TruncatedSVD(n_components = n_comps)
    X = model.fit_transform(x)
elif algorithm == 1:
    model = manifold.MDS(n_components = n_comps)
    X = model.fit_transform(x)
elif algorithm == 2:
    model = manifold.Isomap(n_components = n_comps)
    X = model.fit_transform(x)
elif algorithm == 3:
    model = manifold.TSNE(n_components = n_comps)
    X = model.fit_transform(x)
elif algorithm == 4:
    n_points, input_size = x.shape
    som_size = int(np.sqrt(n_points)/2)
    model = MiniSom(som_size, som_size, input_size, sigma = 0.9, learning_rate = 0.5)
    model.train_random(x, 100)
    X = np.zeros((n_points, 2))
    jitX = np.random.normal(0, 0.5, n_points)
    jitY = np.random.normal(0, 0.5, n_points)
    for i in range(n_points):
        w = model.winner(x[i,:])
        X[i,0] = w[0] + jitX[i]
        X[i,1] = w[1] + jitY[i]
elif algorithm == 5:
    nbrs = NearestNeighbors(n_neighbors=5).fit(x)
    adj = nbrs.kneighbors_graph(x).toarray()
    G = nx.from_numpy_matrix(adj)
    pos = nx.spring_layout(G)
    X = np.array(list(pos.values()))

x = np.savetxt(os.path.dirname(fname)+"/map.ds", X)
print("done!")
