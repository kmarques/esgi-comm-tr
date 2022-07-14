export default function updateMoveHandler(ws) {
  return function (player) {
    ws.send(
      JSON.stringify({
        type: "move",
        player: {
          name: player.name,
          x: player.x,
          y: player.y,
        },
      })
    );
  };
}
