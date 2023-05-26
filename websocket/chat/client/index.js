let username;

document.getElementById("formUser").addEventListener("submit", function (e) {
  e.preventDefault();
  username = document.getElementById("user").value;
  document.getElementById("formUser").style.display = "none";
  document.getElementById("chat").style.display = "block";

  const ws = startWebsocket();
  bindEvents(ws);
});

function startWebsocket() {
  const ws = new WebSocket("ws://localhost:3000");

  ws.addEventListener("open", () => {
    console.log("Connected to the server");
    ws.send(JSON.stringify(createWSMessage(username, "coucou")));
  });

  ws.addEventListener("error", (e) => {
    console.error(e);
  });

  ws.addEventListener("message", (event) => {
    const eventData = JSON.parse(event.data);
    const div = createMessage(eventData.payload);
    div.addEventListener("click", function (e) {
      const event = createWSBan(eventData.payload.username);
      ws.send(JSON.stringify(event));
    });
  });

  return ws;
}

function createMessage(messagePayload, sender = false) {
  const divMessage = document.createElement("div");
  const text = document.createTextNode(
    `${messagePayload.username}: ${messagePayload.message} - ${messagePayload.date}`
  );
  divMessage.appendChild(text);
  divMessage.style.alignSelf = sender ? "flex-end" : "flex-start";
  document.getElementById("messages").appendChild(divMessage);
  return divMessage;
}

function bindEvents(ws) {
  document
    .getElementById("formMessage")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const message = document.getElementById("message").value;
      const event = createWSMessage(username, message);
      ws.send(JSON.stringify(event));
      createMessage(event.payload, true);
      e.target.reset();
    });

  document.getElementById("rooms").addEventListener("change", function (e) {
    const event = createWSJoin(e.target.value);
    ws.send(JSON.stringify(event));
    document.getElementById("messages").innerHTML = "";
  });
}

function createWSMessage(username, message) {
  return {
    type: "message",
    payload: {
      message,
      username,
    },
  };
}

function createWSJoin(room) {
  return {
    type: "join",
    payload: { room, username },
  };
}

function createWSBan(username) {
  return {
    type: "ban",
    payload: username,
  };
}
