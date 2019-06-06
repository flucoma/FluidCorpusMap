import sys, os
import numpy as np
from random import shuffle
from untwist.data import Wave
from untwist.transforms import STFT
import torch
from torch.autograd import Variable
from torch import nn, optim
from autoencoder import AutoEncoder


def get_spectrogram(path):
    x = Wave.read(path).to_mono()
    return STFT().process(x).magnitude().T

def extract_spectrograms(indexFile):
    global input_matrix
    for line in open(indexFile, "rt"):
        spectrogram = get_spectrogram(line[:-1])
        spectrograms.append(spectrogram)
        input_matrix = np.append(input_matrix, spectrogram, axis = 0)

def train_ae():
    indices = np.arange(input_matrix.shape[0])
    n_batches = int(np.floor(len(indices)/batch_size))
    criterion = nn.MSELoss()
    optimizer = optim.Adam(ae.parameters(), lr= 5e-4)
    loss_curve = []
    for epoch in range (num_iterations):
        np.random.shuffle(indices)
        batches = np.split(indices[:n_batches*batch_size], n_batches)
        print(epoch, " / ", num_iterations)
        ae.train()
        epoch_loss = 0
        for b in batches:
            v = Variable(torch.from_numpy(input_matrix[b,:].astype(np.float32)))
            optimizer.zero_grad()
            output = ae(v)
            loss = criterion(output,v)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        #loss_curve.append(loss.data[0])
        print(epoch_loss/batch_size)
        loss_curve.append(epoch_loss/batch_size)


def get_stats(ftr):
    return  (
        np.mean(ftr,0),
        np.std(ftr,0),
        np.min(ftr,0),
        np.max(ftr,0)
    )

def get_learnt_features(spectrogram):
    v = Variable(torch.from_numpy(spectrogram.astype(np.float32)))
    ftr = ae.get_hidden(v).detach().numpy()
    ftr_dif = np.diff(ftr,1, 0)
    f1, f2, f3, f4 = get_stats(ftr)
    f5, f6, f7, f8 = get_stats(ftr_dif)
    summary = np.concatenate((f1,f2,f3,f4,f5,f6,f7,f8))
    return summary

dsFile = sys.argv[1]
outFile = sys.argv[2]

eps = np.spacing(1)
batch_size = 400
num_iterations = 10
spectrograms = []
input_matrix = np.empty((0, 513))
output_matrix = np.empty((0, 104))
ae = AutoEncoder(513, 13)
extract_spectrograms(dsFile)
train_ae()
for s in spectrograms:
    x = get_learnt_features(s)
    output_matrix = np.append(output_matrix, [x], axis = 0)
np.savetxt(outFile, output_matrix)
