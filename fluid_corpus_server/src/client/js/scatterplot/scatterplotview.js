
export default class ScatterPlotView{

  constructor(element){
    this.element = element;
    this.element.width  = window.innerWidth;
    this.element.height = window.innerHeight;
    this.context = this.element.getContext('2d');
  }

  draw(model, highlight){
    let width  = window.innerWidth;
    let height = window.innerWidth;
    this.element.width  = window.innerWidth;
    this.element.height = window.innerHeight;
    let radius = 5;
    let ctx = this.element.getContext('2d');
    console.log(model);
    ctx.clearRect ( 0 , 0 ,  width , height);
    for(let i = 0; i < model.pos.length - 1; i++){
      let x = model.pos[i][0];
      let y = model.pos[i][1];
      ctx.fillStyle = (i == highlight)? 'white': "hsla("+model.pos[i][2]+", 100%, 50%, 0.8)";
      ctx.beginPath();
      ctx.arc(x, y, model.pos[i][3], 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000033';
      ctx.stroke();
    }
  }

  /*redraw(){
    console.log("redraw", this);
    console.log("pos", this.pos);
    this.draw(this.pos, null);
  }*/

  drawTouch(x,y){
    //this.redraw();
    let ctx = this.context;
    ctx.clearRect ( 0 , 0 , ctx.width , ctx.height);
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, 2 * Math.PI, false);
    ctx.strokeStyle = "white";// TODO
    ctx.stroke();
  }

  colorForId(id) {
    let r = id % 16;
    let g = Math.floor(id / 3) % 16;
    let b = Math.floor(id / 7) % 16;
    r = r.toString(16); // make it a hex digit
    g = g.toString(16); // make it a hex digit
    b = b.toString(16); // make it a hex digit
    let color = "#" + r + g + b;
    return color;
  }

}
