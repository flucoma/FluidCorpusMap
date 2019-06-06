import io from 'socket.io-client';
import stats from 'stats-lite'
import TouchController from '../common/touch.js';
import MultiSliderView from './multisliderview.js';

export default class MultiSlider{
  constructor(corpus, element){
    this.corpus = corpus;
    this.element = element;
    this.sliderPositions = new Array(this.corpus.nDims).fill(0.5);
    this.view = new MultiSliderView(element, this.corpus.nDims);
    this.controller = new TouchController(element, this, this.view);
    this.socket = io();
    this.pos = corpus.computePositions(
        corpus.data, [element.width, element.height]
    );
    console.log(element.height);
    this.histograms = this.computeHistograms(this.corpus, element.height);
  }

  computeHistograms(corpus, n){
    console.log(corpus.stats[1]);
    let histograms = [];
    for(let i = 0; i < this.corpus.nDims ; i ++){
      let h = stats.histogram(corpus.data.map((x)=>x[i]),n);
      let max = Math.max(...h.values);
      let vals = h.values.map((x) => x / max);
      histograms.push(vals);
    }
    return histograms;
  }


  mapPoint(){
    let point = this.sliderPositions.map(
      (x, i) =>  (this.corpus.stats[i].range * x) +  this.corpus.stats[i].min
    );
    return point;
   }

   getSoundId(){
      return this.corpus.getNearest(this.mapPoint()).soundId;
   }

  touchStart(touchId, touchX, touchY){
    let slider = parseInt(touchX / this.view.sliderWidth);
    this.sliderPositions[slider] = touchY / this.element.height;
    this.view.draw(this);
    this.view.drawTouch(touchX, touchY);
    this.mapPoint();
    console.log(this.controller.ongoingTouches.length);
    if(this.controller.ongoingTouches.length == 1)
      this.socket.emit('noteOn', {touchId: 0, soundId:this.getSoundId(),corpusName:"multislider"});
    this.socket.emit('noteSlide', {touchId: 0, soundId:this.getSoundId(), corpusName:"multislider"});
    //this.socket.emit('noteOn', {touchId: touchId, soundId:this.getSoundId(touchX, touchY)});
  }

  touchMove(touchId, touchX, touchY){
    let slider = parseInt(touchX / this.view.sliderWidth);
    this.sliderPositions[slider] = touchY / this.element.height;
    this.view.draw(this);
    this.view.drawTouch(touchX, touchY);
    this.mapPoint();
    this.socket.emit('noteSlide', {touchId: 0, soundId:this.getSoundId(), corpusName:"multislider"});
  }

  touchEnd(touchId, touchX, touchY){
    if(this.controller.ongoingTouches.length == 1)
      this.socket.emit('noteOff', {touchId: touchId,corpusName:"multislider"});
  }
}
