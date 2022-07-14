import HandleAwareObject from "./utils/HandleAwareObject.js";

function Game(canvaElem) {
  HandleAwareObject.call(this);

  const ctx = canvaElem.getContext("2d");
  const elements = [];

  function updateElements() {
    elements.forEach((element) => element.update());
  }

  this.getElements = () => {
    return elements;
  };

  this.addElement = function (element, pos = -1) {
    elements.splice(pos, 0, element);
  };

  this.start = function () {
    const loop = () => {
      updateElements();
      ctx.clearRect(0, 0, canvaElem.width, canvaElem.height);
      elements.forEach((element) => element.draw(ctx));
      requestAnimationFrame(loop);
    };
    loop();
  };
}

Game.prototype = Object.create(HandleAwareObject.prototype);
Game.prototype.constructor = Game;

export default Game;
