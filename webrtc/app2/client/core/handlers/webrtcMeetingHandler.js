import getInstance from "../utils/WebRTCManager.js";

export default function webrtcMeetingHandler(currentPlayer, websocket) {
  return function (meeting) {
    const webrtcManager = getInstance(currentPlayer.name, websocket);
    const [player1, player2] = meeting.elements;
    if (currentPlayer.name === player1 && player1 === meeting.creator) {
      webrtcManager.call(player2);
    }
    if (currentPlayer.name === player2 && player2 === meeting.creator) {
      webrtcManager.call(player1);
    }
  };
}
