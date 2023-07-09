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

const clients = {};
wss.addListener("connection", (ws) => {
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

server.listen(process.env.PORT);

function broadcast(currentClient, event) {
  wss.clients.forEach((client) => {
    if (client !== currentClient && client.readyState === 1) {
      client.send(JSON.stringify(event));
    }
  });
}

function routeWSEvent(event, client) {
  switch (event.type) {
    case "join":
      join(client, event.payload);
      break;
    case "move":
      move(client, event.payload);
    case "message":
      const eventMessage = {
        type: "message",
        payload: { ...event.payload, date: new Date() },
      };
      broadcast(client, eventMessage);
      break;
    case "iceCandidate":
    case "offer":
    case "answer":
      dispatch(event, client);
      break;
    default:
      break;
  }
}

function join(client, { username, color, coordinates }) {
  Object.entries(clients).forEach((cpl) => {
    const userData = cpl[1];
    const eventMessage = {
      type: "userJoin",
      payload: { username: cpl[0], ...userData },
    };
    client.send(JSON.stringify(eventMessage));
  });
  clients[username] = { client, color, coordinates };
  const eventMessage = {
    type: "userJoin",
    payload: { username, color, coordinates },
  };
  broadcast(client, eventMessage);
}

function dispatch(event, client) {
  const { to } = event.payload;
  const toClient = clients[to];
  if (toClient) {
    toClient.client.send(JSON.stringify(event));
  }
}

function move(client, { coordinates }) {
  const username = Object.entries(clients).find(
    (cpl) => client === cpl[1].client
  )[0];
  clients[username] = { ...clients[username], coordinates };
  const eventMessage = {
    type: "playerMoved",
    payload: { username, coordinates },
  };
  broadcast(client, eventMessage);
}
