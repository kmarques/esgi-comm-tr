export default function websocketPlayerHandler(websocket) {
  return function (player) {
    websocket.addEventListener("message", function (event) {
      const { type, player: wplayer } = JSON.parse(event.data);
      if (type === "move") {
        if (wplayer.name === player.name) {
          player.x = wplayer.x;
          player.y = wplayer.y;
        }
      }
    });
  };
}
