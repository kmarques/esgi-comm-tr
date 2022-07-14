import Meeting from "../Meeting.js";
import Player from "../Player.js";
import webrtcMeetingHandler from "./webrtcMeetingHandler.js";
import websocketPlayerHandler from "./websocketPlayerHandler.js";

export default function websocketGameHandler(websocket) {
  return function (game) {
    websocket.addEventListener("message", function (event) {
      const { type, ...payload } = JSON.parse(event.data);
      switch (type) {
        case "join":
          const player = new Player(payload.player.name, payload.player.color);
          player.x = payload.player.x;
          player.y = payload.player.y;
          player.addHandler("websocket", websocketPlayerHandler(websocket));
          game.addElement(player);
          break;
        case "meet":
          const meeting = new Meeting(payload);
          const currentPlayer = game.getElements().find((e) => e.current);
          meeting.addHandler(
            "webrtc",
            webrtcMeetingHandler(currentPlayer, websocket)
          );
          game.addElement(meeting);
          break;
      }
    });
  };
}
