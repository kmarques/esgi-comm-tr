let username = null;

document.getElementById("formuser").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  username = data.get("username");
  document.getElementById("formuser").style.display = "none";
  startWebsocket(username).then((socket) => {
    document.getElementById("chat").style.display = "block";
    startChat(socket);
  });
});

function startWebsocket(username) {
  return new Promise((resolve) => {
    const websocket = new WebSocket(
      "ws://localhost:8080/?username=" + username
    );
    websocket.onopen = () => {
      console.log("Connected to server");
      resolve(websocket);
    };
    websocket.onmessage = (event) => {
      console.log(event, event.data);
      const msg = event.data;
      addMessage(msg);
    };
    websocket.onclose = () => {
      console.log("Disconnected from server");
    };
    websocket.onerror = (error) => {
      console.log("Disconnected from server - Error: " + error);
    };
  });
}

/**
 *
 * @param {WebSocket} socket
 */
function startChat(socket) {
  document.getElementById("formmessage").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const msg = data.get("message");
    socket.send(msg);
    event.target.reset();
    addMessage(msg);
  });
}

function addMessage(msg) {
  const li = document.createElement("li");
  const text = document.createTextNode(msg);
  li.appendChild(text);
  document.getElementById("messageList").appendChild(li);
}
