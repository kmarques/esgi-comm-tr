export default function websocketHandler(websocket) {
  return function keyboardHandler(player) {
    websocket.onmessage = function (event) {
      const { type, player: wplayer } = JSON.parse(event.data);
      if (type === "move") {
        if (wplayer.name === player.name) {
          player.x = wplayer.x;
          player.y = wplayer.y;
        }
      }
    };
  };
}
