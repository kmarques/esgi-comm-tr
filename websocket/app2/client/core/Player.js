export default function Player(name, color) {
  this.name = name;
  this.color = color;
  this.x = 0;
  this.y = 0;
  this.speed = 5;
  this.direction = 0;
  this.height = 30;
  this.width = 30;
  const handlers = [];

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
    if (handlers["onUpdate"]) {
      handlers["onUpdate"](this);
    }
  };

  this.draw = function (ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(this.name, this.x + 5, this.y + 15);
  };

  this.addHandler = function (name, handler) {
    handlers[name] = name.startsWith("on") ? handler : handler(this);
  };

  this.removeHandler = function (name) {
    if (!name.startsWith("on")) {
      handlers[name]();
    }
    delete handlers[name];
  };
}
