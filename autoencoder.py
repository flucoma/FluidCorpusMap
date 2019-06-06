import sys, os
import numpy as np
import torch
from torch.autograd import Variable
from torch import nn, optim
from torch.nn.init import xavier_uniform, kaiming_uniform_, uniform, normal, constant
import torch.nn.functional as F
from random import shuffle

class AutoEncoder(nn.Module):
    def __init__(self, n_bins,n_hidden):
        self.n_bins = n_bins
        self.n_hidden = n_hidden
        super(AutoEncoder, self).__init__()
        self.hidden1 = nn.Linear(n_bins, n_bins, bias=True)
        self.hidden = nn.Linear(n_bins, n_hidden, bias=True)
        self.out   = nn.Linear(n_hidden,n_bins, bias=True)
        xavier_uniform(self.hidden1.weight)
        xavier_uniform(self.hidden.weight)
        kaiming_uniform_(self.out.weight)

    def forward(self, x):
        x = self.hidden1(x)
        x = F.sigmoid(x)
        x = self.hidden(x)
        x = torch.sigmoid(x)
        x = self.out(x)
        x = F.relu(x)
        return x
    def get_hidden(self, x):
        x = self.hidden(x)
        x = torch.sigmoid(x)
        return x


def train_ae(ae,input_matrix, batch_size=400, num_iterations=10,contractive=True):
    indices = np.arange(input_matrix.shape[0])
    n_batches = int(np.floor(len(indices)/batch_size))
    criterion = nn.MSELoss()
    optimizer = optim.Adam(ae.parameters(), lr= 5e-4)
    lmb=1e-5
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
            if contractive:
                #Contractive loss https://github.com/avijit9/Contractive_Autoencoder_in_Pytorch/blob/master/CAE_pytorch.py
                # http://www.icml-2011.org/papers/455_icmlpaper.pdf#contractive loss
                h = ae.get_hidden(v)
                dh = h * (1 - h)
                hidden_weights_sum = torch.sum(ae.hidden.weight**2,dim=1)
                hidden_weights_sum = hidden_weights_sum.unsqueeze(1)
                contractive_loss = torch.sum(torch.mm(dh**2,hidden_weights_sum),0) // batch_size
                loss = loss + lmb * contractive_loss
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        #loss_curve.append(loss.data[0])
        print(epoch_loss/batch_size)
        loss_curve.append(epoch_loss/batch_size)

def get_learnt_features(ae,X):
    features = np.empty((X.shape[0],ae.n_hidden))
    for i,s in enumerate(X):
        v = Variable(torch.from_numpy(s.astype(np.float32)))
        features[i,:] = ae.get_hidden(v).detach().numpy()
    return features
