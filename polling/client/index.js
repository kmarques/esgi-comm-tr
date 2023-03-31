const messageListElem = document.getElementById("messages");
const messageFormElem = document.getElementById("addMessage");
const selectedRoomElem = document.getElementById("selectedRoom");
let lastId = 0;

function getRoom() {
  return selectedRoomElem.value;
}

// Add message to the DOM
function addMessage({ message, user }) {
  //const msg = message.message;
  //const user = message.user;
  //const { message, user } = messageObj;

  const messageElem = document.createElement("li");
  const textnode = document.createTextNode(`${message} - ${user}`);
  messageElem.appendChild(textnode);
  messageListElem.append(messageElem);
}
// Update badges
function updateBadges(message) {
  if (message.room === getRoom()) return;
  const elemBadgeContainer = document.getElementById("badgeContainer");
  Array.from(elemBadgeContainer.children).forEach((badgeElem) => {
    if (badgeElem.dataset.room === message.room) {
      const counterElem = badgeElem.querySelector('[data-rel="badge-count"]');
      counterElem.innerText = parseInt(counterElem.innerText || 0) + 1;
    }
  });
}
// Refresh message on room change
selectedRoomElem.addEventListener("change", (event) => {
  messageListElem.childNodes.forEach((c) => messageListElem.removeChild(c));
  getMessages().then(subscribeNewMessage);
});
// Get form data and send them to the backend
messageFormElem.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData);
  payload.room = getRoom();

  fetch("http://localhost:3000/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (response.status === 201) {
        event.target.reset();
        return response.json();
      } else {
        throw new Error("Something went wrong");
      }
    })
    .then((message) => {
      //addMessage(message);
      lastId = message.id;
    });
});

function getMessages() {
  const params = new URLSearchParams();
  params.append("room", getRoom());

  return fetch("http://localhost:3000/messages?" + params.toString())
    .then((response) => response.json())
    .then((messages) => {
      messages.forEach(addMessage);
      if (messages.length) lastId = messages[messages.length - 1].id;
    });
}

function subscribeNewMessage() {
  fetch("http://localhost:3000/messages/subscribe?room=" + getRoom())
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong");
      }
    })
    .then((message) => {
      addMessage(message);
      subscribeNewMessage();
    });
}

function regularPollingV1() {
  getMessages();
  setInterval(getMessages, 1000);
}

function regularPollingV2() {
  getMessages().then(() => {
    setTimeout(regularPollingV2, 1000);
  });
}

// Subscribe to notifications
function subNotification() {
  fetch("http://localhost:3000/subscribe")
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong");
      }
    })
    .then(dispatch)
    .then(subNotification);
}
// Notification dispatcher
async function dispatch(event) {
  switch (event.type) {
    case "NEW_MESSAGE":
      updateBadges(event.payload);
      break;
  }
}

// Initial calls
getMessages().then(subscribeNewMessage);
subNotification();
