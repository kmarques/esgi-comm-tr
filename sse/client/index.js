document.getElementById("sendMessage").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  fetch("http://localhost:3000/messages", {
    method: "POST",
    body: JSON.stringify({ title: data.get("message") }),
    headers: {
      "Content-Type": "application/json",
    },
  }).then(() => alert("Message sent"));
});

// generate a tic-tac-toe board with coordinates
function ticTacToe(moves) {
  const board = document.getElementById("board");
  board.innerHTML = "";
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < 3; j++) {
      const cell = document.createElement("td");
      cell.style.width = "50px";
      cell.style.height = "50px";
      cell.style.border = "1px solid black";
      const currentMove = moves.find((m) => m.i === i && m.j === j);
      const text = document.createTextNode(
        currentMove ? (currentMove.user === username ? "X" : "O") : ""
      );
      cell.addEventListener("click", (event) => {
        const currentMove = moves.find((m) => m.i === i && m.j === j);
        if (currentMove) {
          alert("This cell is already taken");
          return;
        }
        gameStarted &&
          makeMove({
            i,
            j,
            user: username,
          });
      });
      cell.appendChild(text);
      row.appendChild(cell);
    }
    rows.push(row);
  }
  board.append(...rows);
  return board;
}

let username = null;
let moves = [];
let eventSource = null;
let gameStarted = false;

document.getElementById("formUser").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  username = data.get("username");
  if (eventSource) eventSource.close();
  eventSource = new EventSource(
    "http://localhost:3000/subscribe?user=" + data.get("username"),
    {
      withCredentials: true,
    }
  );

  event.target.getElementsByTagName("input")[0].disabled = "disabled";

  eventSource.onmessage = (event) => {
    const { title: msg } = JSON.parse(event.data);
    const li = document.createElement("li");
    const text = document.createTextNode(msg);
    li.appendChild(text);
    document.getElementById("messagesList").appendChild(li);
  };

  eventSource.addEventListener("player-joined", (event) => {
    const { user } = JSON.parse(event.data);
    if (user !== username) {
      addMessage(`${user} joined`);
      gameStarted = true;
    }
  });

  eventSource.addEventListener("player-quit", (event) => {
    const { user } = JSON.parse(event.data);
    addMessage(`${user} quit`);
    gameStarted = false;
  });

  eventSource.addEventListener("new-move", (event) => {
    const move = JSON.parse(event.data);
    moves.push(move);
    addMessage(`${move.user} chose ${move.i}, ${move.j}`);
    ticTacToe(moves);
  });

  eventSource.addEventListener("match-end", (event) => {
    const move = JSON.parse(event.data);
    addMessage(`${move.user} wins!`);
    moves = [];
    ticTacToe([]);
  });
});

function addMessage(msg) {
  const li = document.createElement("li");
  const text = document.createTextNode("Notif: " + msg);
  li.appendChild(text);
  document.getElementById("messagesList").appendChild(li);
}

function makeMove(move) {
  fetch("http://localhost:3000/moves", {
    method: "POST",
    body: JSON.stringify(move),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

ticTacToe([]);
