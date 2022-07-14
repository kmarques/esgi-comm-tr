let instance = null;
const iceServers = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

function videoElement(stream, name) {
  const videoContainer = document.createElement("div");
  videoContainer.style.position = "relative";
  const caption = document.createElement("strong");
  caption.innerText = name;
  caption.style.position = "absolute";
  caption.style.bottom = "0";
  caption.style.left = "0";
  caption.style["padding-left"] = "15px";
  caption.style["padding-bottom"] = "15px";
  caption.style["padding-top"] = "15px";
  caption.style.color = "black";
  caption.style["text-transform"] = "uppercase";
  caption.style["font-size"] = "20px";
  caption.style["background-color"] = "rgba(255,255,255,0.5)";
  caption.style.width = "100%";
  caption.style.margin = "0";
  const video = document.createElement("video");
  video.srcObject = stream;
  video.autoplay = true;
  video.controls = false;
  video.id = name;
  videoContainer.appendChild(video);
  videoContainer.appendChild(caption);
  return videoContainer;
}

export default function getInstance(sender, websocket) {
  if (!instance) {
    instance = new WebRTCManager(sender, websocket);
  }

  return instance;
}

function WebRTCManager(sender, websocket) {
  const signal = new SignalManager(websocket);

  const connections = {};

  this.call = function (receiver) {
    const connection = new RTCPeerConnection({ iceServers });
    connection.addEventListener("icecandidate", function (event) {
      if (event.candidate) {
        signal.send("ice", {
          candidate: event.candidate,
          receiver: receiver,
          sender,
        });
      }
    });

    connection.addEventListener("negotiationneeded", function () {
      connection.createOffer().then(function (offer) {
        connection.setLocalDescription(offer);
        signal.send("offer", {
          offer: offer,
          receiver: receiver,
          sender,
        });
      });
    });

    connection.addEventListener("connectionstatechange", function () {
      console.log(receiver, "Conneciton status: ", connection.connectionState);
    });

    connection.addEventListener("iceconnectionstatechange", function () {
      console.log(
        receiver,
        "Conneciton status: ",
        connection.iceConnectionState
      );
    });

    connection.addEventListener("track", (event) => {
      console.log("stream from track", event.streams[0]);
      document
        .getElementById("videos")
        .appendChild(videoElement(event.streams[0], receiver));
    });

    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then(function (stream) {
        console.log("stream from caller", stream);
        stream
          .getTracks()
          .forEach((track) => connection.addTrack(track, stream));
        document
          .getElementById("videos")
          .appendChild(videoElement(stream, sender));
      });

    connections[receiver] = connection;
  };

  signal.addEventListener("offer", (payload) => {
    const { offer, receiver, sender: _sender } = payload;
    if (receiver !== sender) {
      return;
    }
    const connection = new RTCPeerConnection({ iceServers });
    connection
      .setRemoteDescription(offer)
      .then(() =>
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      )
      .then(function (stream) {
        console.log("stream from callee", stream);
        stream
          .getTracks()
          .forEach((track) => connection.addTrack(track, stream));
        document
          .getElementById("videos")
          .appendChild(videoElement(stream, receiver));
      })
      .then(() => connection.createAnswer())
      .then(async function (answer) {
        await connection.setLocalDescription(answer);
        return answer;
      })
      .then((answer) => {
        signal.send("answer", {
          answer: answer,
          receiver: _sender,
          sender,
        });
      });

    connection.addEventListener("icecandidate", function (event) {
      if (event.candidate) {
        signal.send("ice", {
          candidate: event.candidate,
          receiver: _sender,
          sender,
        });
      }
    });

    connection.addEventListener("track", (event) => {
      console.log("stream from track", event.streams[0]);
      document
        .getElementById("videos")
        .appendChild(videoElement(event.streams[0], _sender));
    });

    connection.addEventListener("connectionstatechange", function () {
      console.log(_sender, "Conneciton status: ", connection.connectionState);
    });

    connections[_sender] = connection;
  });

  signal.addEventListener("answer", (payload) => {
    const { answer, receiver, sender: _sender } = payload;
    if (receiver !== sender) {
      return;
    }
    connections[_sender].setRemoteDescription(answer);
  });

  signal.addEventListener("ice", (payload) => {
    const { candidate, receiver, sender: _sender } = payload;
    if (receiver !== sender) {
      return;
    }
    connections[_sender].addIceCandidate(candidate);
  });
}

function SignalManager(websocket) {
  const eventListeners = {};

  this.addEventListener = function (type, listener) {
    if (!eventListeners[type]) {
      eventListeners[type] = listener;
    }
  };

  websocket.addEventListener("message", function (event) {
    const { type, ...payload } = JSON.parse(event.data);
    //webrtc-offer
    if (type.startsWith("webrtc-")) {
      // => offer
      eventListeners[type.replace("webrtc-", "")](payload);
    }
  });

  // offer
  this.send = function (type, payload) {
    // webrtc-offer
    websocket.send(JSON.stringify({ type: "webrtc-" + type, ...payload }));
  };
}
