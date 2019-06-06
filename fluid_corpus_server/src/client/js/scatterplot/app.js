import Corpus from '../common/corpus.js';
import {disableScroll} from '../common/utils.js';
import TouchController from '../common/touch.js';
import ScatterPlotView from './scatterplotview.js';
import ScatterPlot from './scatterplotmodel.js';
import io from 'socket.io-client';

let socket = io();

function loadCorpus(){
  let canvas = window.document.querySelector('#scatterplot');
  let view = new ScatterPlotView(canvas);
  Corpus.loadCorpus('/js/scatterplot/map.ds')
    .then((corpus)=>{
      let model = new ScatterPlot(corpus, canvas);
      model.view.draw(model, null);
      console.log("loading", view);
      });
}

function loadPlayer(){
  socket.emit('loadPlayer', {name:'player', fname: './buffer_player.scd', corpusName:"scatterplot"});
  socket.on("player_loaded", loadCorpus);
}

function loadBuffers(){
  socket.emit('loadBuffers', {indexFile: "./scatterplot/filenames.ds",name:"scatterplot"});
  socket.on("buffers_loaded", loadPlayer);
}

export function runScatterPlot(){
  disableScroll();
  loadBuffers();
}
