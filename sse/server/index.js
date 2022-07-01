const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

let subscribers = {};
let messages = [];
let moves = [];
let eventId = 0;

app.post("/messages", (req, res) => {
  // SSE
  broadcast({ data: req.body });
  res.sendStatus(201);
});

app.post("/moves", (req, res) => {
  // SSE
  broadcast({ event: "new-move", data: req.body });
  moves.push(req.body);
  const winner = calculateWinner(moves);
  if (winner) {
    broadcast({ event: "match-end", data: { user: winner } });
    moves = [];
  }
  res.sendStatus(201);
});

app.get("/subscribe", (req, res) => {
  const { user, lastEventId = -1 } = req.query;
  subscribers[user] = { socket: res };
  console.log(`New connection: ${user} - ${res.socket.remoteAddress}`);
  req.on("end", () => {
    console.log(`Disconnected: ${user} - ${res.socket.remoteAddress}`);
    broadcast({ event: "player-quit", data: { user } });
    delete subscribers[user];
    if (Object.keys(subscribers).length === 0) {
      messages = [];
    }
  });
  req.on("error", (err) => {
    console.error(`Error: user ${user} - ${err}`);
    broadcast({ event: "player-quit", data: { user } });
    delete subscribers[user];
    if (Object.keys(subscribers).length === 0) {
      messages = [];
    }
  });
  // SSE
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  // Send player joined message when user is connected
  broadcast({ event: "player-joined", data: { user } });

  // Send messages that happened to the user newly connected
  messages.forEach((msg) => {
    if (msg.id > lastEventId) {
      res.write("id: " + msg.id + "\n");
      res.write("event: " + msg.event + "\n");
      res.write("data: " + JSON.stringify(msg.data) + "\n\n");
    }
  });
});

const broadcast = ({ event, data }) => {
  eventId++;
  Object.entries(subscribers).forEach(([username, { socket }]) => {
    console.log(
      `Sending ${event} to: ${username} value: ${JSON.stringify(data)}`
    );
    socket.write("id: " + eventId + "\n");
    if (event) socket.write("event: " + event + "\n");
    socket.write("data: " + JSON.stringify(data) + "\n\n");
    subscribers[username].lastEvent = eventId;
  });
  messages.push({ id: eventId, event, data });
};

function calculateWinner(moves) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    const firstWinnerMove = moves.find((move) => move.i * 3 + move.j === a);
    if (firstWinnerMove) {
      const lineMoves = moves.filter(
        (move) =>
          (move.i * 3 + move.j === b || move.i * 3 + move.j === c) &&
          move.user === firstWinnerMove.user
      );
      if (lineMoves.length === 2) {
        return firstWinnerMove.user;
      }
    }
  }
  return null;
}

app.listen(3000, () => console.log("Server listening on port 3000"));
