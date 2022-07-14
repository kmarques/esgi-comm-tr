import HandleAwareObject from "./utils/HandleAwareObject.js";

function Player(name, color) {
  HandleAwareObject.call(this);

  this.name = name;
  this.color = color;
  this.x = 0;
  this.y = 0;
  this.speed = 5;
  this.direction = "none";
  this.height = 30;
  this.width = 30;

  this.update = function () {
    if (
      this.direction === "left" ||
      this.direction === "upLeft" ||
      this.direction === "downLeft"
    ) {
      this.x -= this.speed;
    }
    if (
      this.direction === "right" ||
      this.direction === "upRight" ||
      this.direction === "downRight"
    ) {
      this.x += this.speed;
    }
    if (
      this.direction === "up" ||
      this.direction === "upLeft" ||
      this.direction === "upRight"
    ) {
      this.y -= this.speed;
    }
    if (
      this.direction === "down" ||
      this.direction === "downLeft" ||
      this.direction === "downRight"
    ) {
      this.y += this.speed;
    }
    if (this.direction !== "none" && this.getHandler("onUpdate")) {
      this.getHandler("onUpdate")(this);
    }
  };

  this.draw = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(this.name, this.x + 5, this.y + 15);
  };
}

Player.prototype = Object.create(HandleAwareObject.prototype);
Player.prototype.constructor = Player;

export default Player;
