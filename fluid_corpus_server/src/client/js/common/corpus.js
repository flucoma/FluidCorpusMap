import {CSVToArray} from './utils.js'
import kdTree from 'kd-tree-javascript'

export default class Corpus{

  constructor(data){
    this.data = data.slice(0,data.length - 1);
    this.nDims = this.data[0].length;
    this.stats = this.computeStats(data);
    this.layoutKeys = data[0].map((x, i) => "_" + i);
    this.tree = this.buildTree(data);

    //this is for then
    //context.positions = computePositions(corpus);
    //draw(corpus);
  }

  static loadCorpus(url){
    return fetch(url)
      .then(function(response) {
        return response.text();
      })
      .then(function(myTxt) {
        var result = CSVToArray(myTxt, " ");
        return new Corpus(result);
      });
  }

  makePoint(p){
    let point = {};
    for(let i = 0; i < p.length; i++){
      point[this.layoutKeys[i]] = p[i];
    }
    return point;
  }

  euclideanDistance(a, b){
    return Math.sqrt(Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2));
  }

  buildTree(data){
    let points = data.map((d, i) => {
      let point = this.makePoint(d);
      //console.log(point, d, i)
      point.soundId = i;
      return point;
    });
    return new kdTree.kdTree(points, this.euclideanDistance, this.layoutKeys);
  }

  getNearest(point){
    let nearest = this.tree.nearest(this.makePoint(point), 1);
    return nearest[0][0]
  }

  computeStats(data){
    let stats = new Array(data[0].length);
    for (let i = 0; i < data[0].length; i++){
      let tmp = this.data.slice(0, this.data.length - 1).map(x => x[i]);
      let minVal = Math.min(...tmp);
      let maxVal = Math.max(...tmp);
      stats[i] = {
         min: minVal, max: maxVal, range:maxVal - minVal
       };
    }
    return stats;
  }

computePositions(data, dims){
  return data.map((p) =>
    p.map((x, i) => {
      return dims[i] * (p[i] - this.stats[i].min) / this.stats[i].range
    }
  ))
}

}
