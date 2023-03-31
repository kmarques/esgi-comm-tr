const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const messages = [];
const rooms = {
  room1: [],
  room2: [],
  room3: [],
};
const subscribers = [];

app.get("/messages", (req, res) => {
  res.json(messages.filter((message) => message.room === req.query.room));
});

app.post("/messages", (req, res) => {
  const message = { id: Date.now(), ...req.body };
  messages.push(message);
  broadcastToRoom(message);
  notify({
    type: "NEW_MESSAGE",
    payload: message,
  });
  res.status(201).json(message);
});

app.get("/messages/subscribe", (req, res) => {
  rooms[req.query.room].push(res);
  res.writeHead(200, {
    Connection: "keep-alive",
    "Keep-Alive": "timeout=60, max=1000",
  });
});

app.get("/subscribe", (req, res) => {
  subscribers.push(res);
  res.writeHead(200, {
    Connection: "keep-alive",
    "Keep-Alive": "timeout=60, max=1000",
  });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

function broadcastToRoom(message) {
  rooms[message.room].forEach((res, index) => {
    res.write(JSON.stringify(message));
    res.end();
    delete rooms[message.room][index];
  });
}

function notify(event) {
  subscribers.forEach((res, index) => {
    res.write(JSON.stringify(event));
    res.end();
    delete subscribers[index];
  });
}
