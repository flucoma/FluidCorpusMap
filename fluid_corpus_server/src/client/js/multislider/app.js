import {disableScroll} from '../common/utils.js';
import Corpus from '../common/corpus.js';
import TouchController from '../common/touch.js';
import MultiSliderView from './multisliderview.js';
import MultiSliderModel from './multislidermodel.js';
import io from 'socket.io-client';

let socket = io();

function loadCorpus(){
  let canvas = window.document.querySelector('#multislider');
  Corpus.loadCorpus('/js/scatterplot/map.ds')
    .then((corpus)=>{
      let model = new MultiSliderModel(corpus, canvas);
      model.view.draw(model, null);
      });
}

function loadPlayer(){
  socket.emit('loadPlayer', {name:'granular', fname: './granular.scd', corpusName:"multislider"});
  socket.on("player_loaded", loadCorpus);
}

function loadBuffers(){
  socket.emit('loadBuffers', {indexFile: "./multislider/filenames.ds",name:"multislider"});
  socket.on("buffers_loaded", loadPlayer);
}

export function runMultiSlider(){
    disableScroll();
    loadBuffers();
  }
