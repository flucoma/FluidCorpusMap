import io from 'socket.io-client';
import TouchController from '../common/touch.js';
import ScatterPlotView from './scatterplotview.js';

export default class ScatterPlot{
  constructor(corpus, element){
    this.corpus = corpus;
    this.element = element;
    this.pos = corpus.computePositions(
        corpus.data, [element.width, element.height, 360, 50]
    );
    console.log(this.pos);
    this.socket = io();
    this.view = new ScatterPlotView(element);
    this.controller = new TouchController(element, this, this.view);
  }

  mapPoint(touchX, touchY){
    console.log(touchX);
    console.log(this.element.width);
    console.log( this.corpus.stats);
    return {
      x:(touchX / this.element.width * this.corpus.stats[0].range) + this.corpus.stats[0].min,
      y:(touchY / this.element.height * this.corpus.stats[1].range) + this.corpus.stats[1].min
    }
   }

   getSoundId(touchX, touchY){
      let originalPoint = this.mapPoint(touchX, touchY);
      console.log(originalPoint);
      return this.corpus.getNearest([originalPoint.x, originalPoint.y]).soundId;
   }

  touchStart(touchId, touchX, touchY){
    //console.log("start");
    let id = this.getSoundId(touchX, touchY);
    this.view.draw(this, id);
    this.view.drawTouch(touchX, touchY);
    this.socket.emit('noteOn', {touchId: touchId, soundId:id, corpusName:"scatterplot"});
  }

  touchMove(touchId, touchX, touchY){
    //console.log("move");
    let id = this.getSoundId(touchX, touchY);
    this.view.draw(this, id);
    this.view.drawTouch(touchX, touchY);
    this.socket.emit('noteSlide', {touchId: touchId, soundId:id, corpusName:"scatterplot"});
  }
  touchEnd(touchId, touchX, touchY){
    //console.log("end");
    this.socket.emit('noteOff', {touchId: touchId, corpusName:"scatterplot"});
  }
}
