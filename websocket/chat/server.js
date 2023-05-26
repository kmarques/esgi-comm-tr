const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");
const fs = require("fs/promises");

const server = createServer(async (req, res) => {
  // /index.html => index.html
  const filepath = req.url.slice(1) || "index.html";
  const file = path.join(__dirname, "client", filepath);
  try {
    await fs.access(file);
    res.writeHead(200, {
      "Content-Type": filepath.endsWith(".js")
        ? "application/javascript"
        : "text/html",
    });
    res.write(await fs.readFile(file));
  } catch (e) {
    res.writeHead(404);
  } finally {
    res.end();
  }
});

const wss = new WebSocketServer({ server });
const rooms = {
  1: { clients: [], messages: [], bans: [] },
  2: { clients: [], messages: [], bans: [] },
};

wss.addListener("connection", (ws) => {
  joinRoom(ws, { room: 1 });
  ws.addEventListener("open", () => {
    console.log("Connected to the server");
  });

  ws.addEventListener("error", (e) => {
    console.error(e);
  });

  ws.addEventListener("message", (event) => {
    try {
      console.log("Received: " + event.data);
      const eventData = JSON.parse(event.data);
      routeWSEvent(eventData, ws);
    } catch (e) {
      console.error(e);
    }
    //broadcast(wss, {
    //  ...messageData,
    //  date: new Date(),
    //});
  });

  ws.addEventListener("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000);

function broadcast(wss, currentClient, event) {
  wss.clients.forEach((client) => {
    if (client !== currentClient && client.readyState === 1) {
      client.send(JSON.stringify(event));
    }
  });
}

function broadcastToRoom(room, currentClient, event) {
  rooms[room].clients.forEach(({ client }) => {
    if (client !== currentClient && client.readyState === 1) {
      client.send(JSON.stringify(event));
    }
  });
  rooms[room].messages.push(event);
}

function leaveRoom(client) {
  Object.entries(rooms).forEach(([, { clients }]) => {
    const index = clients.findIndex((c) => c.client === client);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });
}

function joinRoom(client, { room, username }) {
  if (rooms[room].bans.includes(username)) {
    client.send(
      JSON.stringify({
        type: "message",
        payload: {
          message: "Vous êtes banni de cette room",
          username: "gatekeeper",
          date: new Date(),
        },
      })
    );
    return;
  }
  leaveRoom(client);
  rooms[room].clients.push({ client, username });
  rooms[room].messages.forEach((message) => {
    client.send(JSON.stringify(message));
  });
}

function routeWSEvent(event, client) {
  const room = findRoomId(client);
  switch (event.type) {
    case "ban":
      rooms[room].bans.push(event.payload);
      const bannedClient = rooms[room].clients.find(
        ({ username }) => username === event.payload
      );
      if (bannedClient) {
        bannedClient.client.send(
          JSON.stringify({
            type: "message",
            payload: {
              message: "Vous êtes banni de cette room",
              username: "gatekeeper",
              date: new Date(),
            },
          })
        );
        leaveRoom(bannedClient.client);
      }
      break;
    case "join":
      joinRoom(client, event.payload);
      client.send(
        JSON.stringify({
          type: "message",
          payload: {
            message: "Bienvenue dans la room " + event.payload.room,
            username: "gatekeeper",
            date: new Date(),
          },
        })
      );
      break;
    case "message":
      const eventMessage = {
        type: "message",
        payload: { ...event.payload, date: new Date() },
      };
      updateUsername(client, room, event.payload.username);
      broadcastToRoom(room, client, eventMessage);
      client.send(
        JSON.stringify({
          type: "message",
          payload: {
            message: "Je dirais même plus " + event.payload.message,
            username: "echo",
            date: new Date(),
          },
        })
      );
      break;
    default:
      break;
  }
}

function findRoomId(client) {
  return Object.entries(rooms).find(([, { clients }]) =>
    clients.find(({ client: C }) => client === C)
  )?.[0];
}

function updateUsername(client, room, username) {
  const clientIndex = rooms[room].clients.findIndex(
    ({ client: C }) => client === C
  );
  if (clientIndex > -1) {
    rooms[room].clients[clientIndex].username = username;
  }
}
