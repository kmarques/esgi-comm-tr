export default function Game(canvaElem) {
  const ctx = canvaElem.getContext("2d");
  const elements = [];

  function updateElements() {
    elements.forEach((element) => element.update());
  }

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
