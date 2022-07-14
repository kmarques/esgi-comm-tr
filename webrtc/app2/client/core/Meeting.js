import HandleAwareObject from "./utils/HandleAwareObject.js";

function Meeting(options) {
  HandleAwareObject.call(this);

  this.id = options.id;
  this.elements = options.elements;
  this.center = options.center;
  this.radius = options.radius;
  this.creator = options.creator;

  this.update = function () {};

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  this.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();
    ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.stroke();
    ctx.closePath();
  };
}

Meeting.prototype = Object.create(HandleAwareObject.prototype);
Meeting.prototype.constructor = Meeting;

export default Meeting;
