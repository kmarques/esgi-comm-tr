let currentPlayer = null;
let othersPlayers = {};
let connection;
let ws;
const canvas = document.getElementById("canvas");

document.getElementById("formUser").addEventListener("submit", function (e) {
  e.preventDefault();
  currentPlayer = {
    username: document.getElementById("user").value,
    color: document.getElementById("color").value,
    coordinates: { x: 0, y: 0 },
  };

  document.getElementById("formUser").style.display = "none";

  document.getElementById("game").style.display = "block";
  const ws = startWebsocket();
  bindEvents(ws);
  updateCanvas();
});

function updateCanvas() {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = currentPlayer.color;
  ctx.fillRect(
    currentPlayer.coordinates.x,
    currentPlayer.coordinates.y,
    10,
    10
  );
  Object.entries(othersPlayers).forEach((player) => {
    const { coordinates, color } = player[1];
    ctx.fillStyle = color;
    ctx.fillRect(coordinates.x, coordinates.y, 10, 10);
    ctx.fillStyle = "black";
    ctx.fillText(player[0], coordinates.x, coordinates.y - 10);
  });
}

function startWebsocket() {
  ws = new WebSocket("ws://localhost:5000");

  ws.addEventListener("open", () => {
    console.log("Connected to the server");
    ws.send(JSON.stringify(createWSJoin()));
  });

  ws.addEventListener("error", (e) => {
    console.error(e);
  });

  ws.addEventListener("message", (event) => {
    const eventData = JSON.parse(event.data);
    routeWSEvent(eventData);
  });

  return ws;
}

function bindEvents(ws) {
  window.addEventListener("keydown", function (e) {
    const direction = getDirection(e);
    switch (direction) {
      case "up":
        if (currentPlayer.coordinates.y > 10) currentPlayer.coordinates.y -= 10;
        break;
      case "down":
        if (currentPlayer.coordinates.y < canvas.height - 10)
          currentPlayer.coordinates.y += 10;
        break;
      case "left":
        if (currentPlayer.coordinates.x > 10) currentPlayer.coordinates.x -= 10;
        break;
      case "right":
        if (currentPlayer.coordinates.x < canvas.width - 10)
          currentPlayer.coordinates.x += 10;
        break;
    }
    updateCanvas();
    ws.send(JSON.stringify(createWSMove()));
    const username = collisionDetection();
    if (username) {
      call(username);
    }
  });
}

function getDirection(e) {
  switch (e.key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
  }
}

function collisionDetection() {
  for (let username in othersPlayers) {
    const { coordinates } = othersPlayers[username];
    if (
      currentPlayer.coordinates.x === coordinates.x &&
      currentPlayer.coordinates.y === coordinates.y
    ) {
      return username;
    }
  }
  return null;
}

function createWSMove() {
  return {
    type: "move",
    payload: currentPlayer,
  };
}

function createWSJoin() {
  return {
    type: "join",
    payload: currentPlayer,
  };
}

async function routeWSEvent(event) {
  switch (event.type) {
    case "userJoin":
      othersPlayers[event.payload.username] = event.payload;
      updateCanvas();
      break;
    case "playerMoved":
      othersPlayers[event.payload.username] = {
        ...othersPlayers[event.payload.username],
        coordinates: event.payload.coordinates,
      };
      updateCanvas();
      break;
    case "iceCandidate":
      getConnection({
        from: currentPlayer.username,
        to: event.payload.from,
      }).addIceCandidate(event.payload.candidate);
      break;
    case "offer":
      manageOffer(event);
      break;
    case "answer":
      manageAnswer(event);
      break;
  }
}

function getConnection({ from, to }) {
  if (!connection) {
    connection = new RTCPeerConnection();
    connection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        console.log("sending ice candidate");
        ws.send(
          JSON.stringify({
            type: "iceCandidate",
            payload: {
              from,
              to,
              candidate: event.candidate,
            },
          })
        );
      }
    });
  }
  return connection;
}

async function call(username) {
  const peer = getConnection({ from: currentPlayer.username, to: username });
  const stream = await startCapture({ video: true });
  const video = document.createElement("video");
  video.srcObject = stream;
  video.play();
  peer.addTrack(stream.getVideoTracks()[0], stream);
  document.getElementById("videos").appendChild(video);
  document
    .getElementById("videos")
    .appendChild(document.createTextNode("My stream"));
  peer.addEventListener("negotiationneeded", async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    ws.send(
      JSON.stringify({
        type: "offer",
        payload: {
          from: currentPlayer.username,
          to: username,
          offer,
        },
      })
    );
  });
}

async function startCapture(displayMediaOptions) {
  let captureStream;

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return captureStream;
}

async function manageOffer(event) {
  const peer = getConnection({
    from: currentPlayer.username,
    to: event.payload.from,
  });
  await peer.setRemoteDescription(event.payload.offer);
  const answer = peer.createAnswer();
  await peer.setLocalDescription(answer);
  ws.send(
    JSON.stringify({
      type: "answer",
      payload: {
        from: currentPlayer.username,
        to: event.payload.from,
        answer,
      },
    })
  );
  peer.addEventListener("track", (event) => {
    const video = document.createElement("video");
    video.srcObject = event.streams[0];
    video.play();
    document.getElementById("videos").appendChild(video);
    document
      .getElementById("videos")
      .appendChild(document.createTextNode("Remote video"));
  });
}

async function manageAnswer(event) {
  const peer = getConnection({
    from: currentPlayer.username,
    to: event.payload.from,
  });
  await peer.setRemoteDescription(event.payload.answer);
}
