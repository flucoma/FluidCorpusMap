export default class TouchController{
  constructor(element, model, view){
    this.element = element;
    this.model = model;
    this.view = view;
    this.ongoingTouches = [];
    element.addEventListener("touchstart", (e) => this.handleStart(e), false);
    element.addEventListener("touchend", (e) => this.handleEnd(e), false);
    element.addEventListener("touchcancel", (e) => this.handleCancel(e), false);
    element.addEventListener("touchmove", (e) => this.handleMove(e), false);
    //console.log("ongoing", this.ongoingTouches )
  }

  handleStart(event) {
    //console.log("handleStart");
    event.preventDefault();
    var touches = event.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      this.ongoingTouches.push(this.copyTouch(touches[i]));
      this.model.touchStart(
        touches[i].identifier,
        touches[i].pageX,
        touches[i].pageY
      );
    }
  }

  handleMove(event) {
    //console.log("handleMove");
    event.preventDefault();
    let touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      var idx = this.ongoingTouchIndexById(touches[i].identifier);
      if (idx >= 0) {
        //this.view.drawTouch(touches[i].pageX,touches[i].pageY );
        this.model.touchMove(
          touches[i].identifier,
          touches[i].pageX,
          touches[i].pageY
        );
      } else {
        console.log("can't figure out which touch to continue");
      }
    }
  }

  handleEnd(event) {
    //console.log("handleEnd");
    event.preventDefault();
    let touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      let idx = this.ongoingTouchIndexById(touches[i].identifier);
      if (idx >= 0)  {
        this.model.touchEnd(touches[i].identifier);
        this.ongoingTouches.splice(idx, 1);
      }
    }
  }

  handleCancel(event) {
    //console.log("handleCancel");
    this.handleEnd(event);
  }

copyTouch(touch) {
  return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
}

ongoingTouchIndexById(idToFind) {
  for (var i = 0; i < this.ongoingTouches.length; i++) {
    var id = this.ongoingTouches[i].identifier;

    if (id == idToFind) {
      return i;
    }
  }
  return -1;    // not found
}
}
