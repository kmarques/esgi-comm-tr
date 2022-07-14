import Game from "./core/Game.js";
import keyboardHandler from "./core/handlers/keyboardHandler.js";
import Player from "./core/Player.js";
import updateMoveHandler from "./core/handlers/updateMoveHandler.js";
import websocketGameHandler from "./core/handlers/websocketGameHandler.js";

document.getElementById("formuser").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const player = new Player(data.get("username"), data.get("color"));
  player.addHandler("keyboard", keyboardHandler);
  player.current = true;
  document.getElementById("formuser").style.display = "none";
  document.getElementById("game").style.display = "block";
  start().then(({ game, websocket }) => {
    game.addElement(player);
    player.addHandler("onUpdate", updateMoveHandler(websocket));
    websocket.send(
      JSON.stringify({
        type: "join",
        player: {
          name: player.name,
          color: player.color,
          x: player.x,
          y: player.y,
        },
      })
    );
    game.start();
  });
});

function start() {
  return new Promise((resolve, reject) => {
    const game = new Game(document.getElementById("board"));
    const websocket = new WebSocket("ws://" + window.location.host);
    game.addHandler("websocket", websocketGameHandler(websocket));
    websocket.onopen = () => {
      console.log("Connected to server");
      resolve({ game, websocket });
    };
    websocket.onclose = () => {
      console.log("Disconnected from server");
    };
    websocket.onerror = (error) => {
      console.log("Disconnected from server - Error: " + error);
    };
  });
}
