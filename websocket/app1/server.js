const { WebSocketServer } = require("ws");

const server = new WebSocketServer({ port: 8080 });

let subscribers = {};

/**
 * @param {WebSocket} socket
 */
server.addListener("connection", (socket, req) => {
  //const remoteAddress = socket.remoteConnection.remoteAddress;
  const remoteAddress = req.socket.remoteAddress;
  const query = req.url.split("?")[1];
  const params = new URLSearchParams(query);
  const username = params.get("username");
  console.log("New connection from: " + remoteAddress + " - " + username);
  subscribers[username] = socket;
  broadcast(socket, username + " joined the chat");
  socket.addListener("message", (message) => {
    message = message.toString("utf8") + " - " + username;
    let match = message.match(/^@([a-z0-9]+)\s+(.*)$/);
    if (match) {
      const [, username, message] = match;
      sendToUser(username, message);
    } else {
      broadcast(socket, message.toString("utf8"));
    }
  });
  socket.addListener("close", () => {
    console.log(remoteAddress + " has been disconnected");
  });
});

server.addListener("listening", () => {
  console.log("Server is listening on port 8080");
});

function broadcast(sender, message) {
  Object.values(subscribers).forEach((socket) => {
    if (socket !== sender) {
      socket.send(message);
    }
  });
}

function sendToUser(username, message) {
  const socket = subscribers[username];
  if (socket) {
    socket.send(message);
  }
}
