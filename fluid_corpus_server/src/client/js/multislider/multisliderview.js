export default class MultiSliderView{

  constructor(element, nSliders){
    this.element = element;
    this.nSliders = nSliders;
    this.element.width  = window.innerWidth;
    this.element.height = window.innerHeight;
    this.context = this.element.getContext('2d');
    this.sliderWidth = this.element.width / nSliders;
  }

  getBins(min, max, n){
    let step = (max - min)/n;
    let bins = [];
    for (let i = 0; i < n; i++){
      bins.push(min + i * step);
    }
    return bins;
  }



  drawHandle(num, pos){
    let ctx = this.context;
    ctx.fillStyle = 'rgba(150, 100, 200, 0.5)';
    ctx.fillRect(this.sliderWidth * num, pos,  this.sliderWidth, 10);
    ctx.fill();
  }

  drawTouch(x,y){
    //this.redraw();
    let ctx = this.context;
    ctx.clearRect ( 0 , 0 , ctx.width , ctx.height);
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI, false);
    ctx.strokeStyle = "white";// TODO
    ctx.stroke();
  }

  draw(model){
    console.log("draw");
    let width = this.element.width;
    let height = this.element.height;
    let ctx = this.context;
    ctx.clearRect (0 , 0 ,  width , height);
    //let hists = this.computeHistograms(model.corpus, height);
    //console.log(hists)

    for(let i = 0; i < this.nSliders; i++){
      ctx.beginPath();
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = "3";
      ctx.stroke();
      let hist = model.histograms[i];
      for(let j = 0; j < height; j ++){
        let v = 100*hist[j];
        ctx.fillStyle = "hsl(245, 100%,"+v+"%)";
        ctx.fillRect(this.sliderWidth * i, j,  this.sliderWidth, 1);
      }
      this.drawHandle(i, parseInt(model.sliderPositions[i] * height));
    }

  }
}
