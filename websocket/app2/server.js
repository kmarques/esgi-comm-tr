const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const fs = require("fs/promises");
const { constants } = require("fs");
const path = require("path");
let subscribers = {};
let playersData = {};

const server = createServer(async function (req, res) {
  const resource = path.join(__dirname, "client", req.url);
  try {
    await fs.access(resource, constants.R_OK);
    if (req.url.endsWith(".html")) {
      res.writeHead(200, { "Content-Type": "text/html" });
    } else if (req.url.endsWith(".js")) {
      res.writeHead(200, { "Content-Type": "application/javascript" });
    }
    res.write(await fs.readFile(resource));
    res.end();
  } catch (err) {
    res.writeHead(404);
    res.end();
  }
});

const serverWs = new WebSocketServer({ server }, () => {
  console.log("Server Websocket started");
});
serverWs.addListener("connection", (socket, req) => {
  socket.onmessage = function (event) {
    manageEvent(JSON.parse(event.data), socket);
  };
});
//server.on("upgrade", function upgrade(request, socket, head) {
//  if (Object.values(subscribers).includes(socket)) return;
//  serverWs.handleUpgrade(request, socket, head, function done(ws) {
//    ws.onmessage = function (event) {
//      manageEvent(JSON.parse(event.data), ws);
//    };
//  });
//});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

function manageEvent(event, ws) {
  switch (event.type) {
    case "join":
      console.log("Player joined " + event.player.name);
      subscribers[event.player.name] = ws;
      playersData[event.player.name] = event.player;
      broadcast(event, event.player.name);
      Object.entries(playersData).forEach(([name, player]) => {
        if (name !== event.player.name) {
          ws.send(
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
        }
      });
      break;
    case "move":
      console.log("Player moved");
      playersData[event.player.name] = {
        ...playersData[event.player.name],
        ...event.player,
      };
      broadcast(event, event.player.name);
      break;
    case "leave":
      console.log("Player left");
      delete subscribers[event.player.name];
      delete playersData[event.player.name];
      broadcast(event, event.player.name);
      break;
    default:
      console.log("Unknown event");
  }
}

function broadcast(event, name) {
  Object.keys(subscribers).forEach((subName) => {
    if (name !== subName) {
      subscribers[subName].send(JSON.stringify(event));
    }
  });
}
