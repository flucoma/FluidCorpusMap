import sys, os
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.spatial import distance
import autoencoder as ae
from untwist.data import Wave
from untwist.transforms import STFT

def get_novelty_curve(features, kernel_size):
    g = signal.gaussian(kernel_size, kernel_size // 3., sym=True)
    G = np.dot(g.reshape(-1, 1), g.reshape(1, -1))
    G[kernel_size // 2:, :kernel_size // 2] = -G[kernel_size // 2:, :kernel_size // 2]
    G[:kernel_size // 2, kernel_size // 2:] = -G[:kernel_size // 2, kernel_size // 2:]
    nc = np.zeros(features.shape[0])
    N = features.shape[0]

    for i in range(kernel_size // 2, N - kernel_size // 2 + (1 - (kernel_size % 2))):
        similarity_matrix = distance.pdist(features[i - kernel_size // 2:(kernel_size % 2) + i + kernel_size // 2],metric='cosine')
        similarity_matrix = 1 - similarity_matrix
        similarity_matrix = distance.squareform(similarity_matrix)
        nc[i] = np.sum(similarity_matrix * G)
    nc -= nc.min()
    nc /= nc.max()
    return nc

def novelty_seg(ftr,kernel_size):
    ftr -= ftr.min()
    ftr /= ftr.max()
    n = get_novelty_curve(ftr,kernel_size)
    print("Finding slices")
    tp,prop = signal.find_peaks(n, height = np.mean(n) + np.std(n),distance = 1)
    return tp.astype(np.int32)


stft_file   = sys.argv[1]
outPath     = sys.argv[2]
kernel_size = int(sys.argv[3])
iterations  = sys.argv[4]
net = ae.AutoEncoder(513, 13)
print("performing STFT")
x = Wave.read(stft_file).to_mono()
X = STFT().process(x).magnitude().T
print("done")
ae.train_ae(net,X)
print("Getting feature vectors")
features = ae.get_learnt_features(net, X)
print("Computing novelty")
boundaries = novelty_seg(features,kernel_size)
np.savetxt(os.path.expanduser(outPath + '/' + Path(stft_file).name + '.ae_segs.ds'), boundaries)
