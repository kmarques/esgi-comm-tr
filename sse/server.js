const express = require("express");
const cors = require("cors");
const chkWinner = require("./connect4");
const app = express();

app.use(cors());
app.use(express.json());

const messages = [];
const eventsSent = [];
const subscribers = {};
const board = Array.from({ length: 6 }, () =>
  Array.from({ length: 7 }, () => 0)
);
app.post("/messages", (req, res) => {
  const message = req.body;
  message.id = Date.now();
  message.date = new Date();
  messages.push(message);
  notify({ id: message.id, name: "message", data: message });
  res.status(201).json(message);
});

app.get("/subscribe", (req, res) => {
  const username = req.query.username;
  subscribers[username] = res;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
  });
  const lastId = req.query["last-id"];
  if (lastId) {
    eventsSent
      .filter((m) => m.id > parseInt(lastId))
      .forEach((m) => notifyUser(m, res));
  }
});

app.post("/moves", (req, res) => {
  const { username, x, y } = req.body;
  if (board[y][x] !== 0) {
    res.sendStatus(400);
  } else {
    board[y][x] = username;
  }
  res.sendStatus(201);
  // Notify to others a move
  notify({
    name: "move",
    data: { x, y, username },
  });

  // Notify to all the winner
  const winnerIs = chkWinner(board);
  if (winnerIs) {
    notify(
      {
        name: "winner",
        data: { username: winnerIs },
      },
      true
    );
  }
});

function notify(event, notifyAll = false) {
  event.id ??= Date.now();
  Object.entries(subscribers).forEach(([username, res]) => {
    if (notifyAll || username !== event.data.username) {
      notifyUser(event, res);
    }
  });
  eventsSent.push(event);
}

function notifyUser(event, userResponse) {
  const dataToSend = [
    `id: ${event.id}`,
    `event: ${event.name}`,
    `data: ${JSON.stringify(event.data)}`,
    "",
  ].join("\n");
  userResponse.write(dataToSend + "\n");
}

app.listen(3000, () => console.log("Server is listening on port 3000"));
