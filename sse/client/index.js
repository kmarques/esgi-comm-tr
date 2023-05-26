let username;
const messages = [];
const formLogin = document.getElementById("login");
const formMessage = document.getElementById("form-message");
const loggedInComponent = document.getElementById("logged-in");
const moves = [];

formLogin.addEventListener("submit", (event) => {
  event.preventDefault();
  username = new FormData(event.target).get("username");

  // Hide login + show logged content
  formLogin.style.display = "none";
  loggedInComponent.style.display = "block";

  // Compute SSE params (username + last id message)
  const params = new URLSearchParams();
  params.set("username", username);
  if (localStorage.getItem("last-id")) {
    params.set("last-id", localStorage.getItem("last-id"));
  }

  const eventSource = new EventSource(
    "http://localhost:3000/subscribe?" + params
  );
  bindEventSource(eventSource);
  refreshBoard();
  document
    .getElementById("username")
    .appendChild(document.createTextNode(username));
});

formMessage.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = {
    username,
    content: event.target.message.value,
  };
  fetch("http://localhost:3000/messages", {
    method: "POST",
    body: JSON.stringify(message),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 201) return response.json();
      else {
        throw new Error();
      }
    })
    .then((data) => {
      messages.push(data);
      localStorage.setItem("last-id", data.id);
      refreshMessages();
    })
    .catch(() => alert("Error sending message"));
});

function sendMove(move) {
  fetch("http://localhost:3000/moves", {
    method: "POST",
    body: JSON.stringify(move),
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (response.status === 201) {
      moves.push(move);
      refreshBoard();
    } else {
      alert("Cell not empty");
    }
  });
}

function refreshMessages() {
  const div = document.getElementById("messages");
  div.innerHTML = "";
  div.style.display = "flex";
  div.style.width = "900px";
  div.style.flexDirection = "column";

  messages.forEach((msg) => {
    const messageElem = document.createElement("span");
    messageElem.appendChild(
      document.createTextNode(`${msg.content} - ${msg.username} (${msg.date})`)
    );
    messageElem.style.alignSelf =
      msg.username === username ? "flex-end" : "flex-start";
    div.appendChild(messageElem);
  });
}

function refreshBoard() {
  const board = document.getElementById("board");
  const table = document.createElement("table");
  for (let y = 0; y < 6; y++) {
    const tr = document.createElement("tr");
    for (let x = 0; x < 7; x++) {
      const td = document.createElement("td");
      const move = moves.find((m) => m.x === x && m.y === y);
      td.appendChild(document.createTextNode(move ? move.username : "•"));
      td.style.width = "30px";
      td.style.height = "30px";
      tr.appendChild(td);
      td.addEventListener("click", () => {
        sendMove({
          x,
          y,
          username,
        });
      });
    }
    table.appendChild(tr);
  }
  board.innerHTML = "";
  board.appendChild(table);
}

function bindEventSource(eventSource) {
  eventSource.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    messages.push(message);
    localStorage.setItem("last-id", event.lastEventId);
    refreshMessages();
  });
  eventSource.addEventListener("move", (event) => {
    const move = JSON.parse(event.data);
    moves.push(move);
    refreshBoard();
    localStorage.setItem("last-id", event.lastEventId);
  });
  eventSource.addEventListener("winner", (event) => {
    const data = JSON.parse(event.data);
    alert(data.username);
    localStorage.setItem("last-id", event.lastEventId);
  });
}
