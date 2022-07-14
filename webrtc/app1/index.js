const iceServers = undefined;
const sender = new RTCPeerConnection({ iceServers });
const receiver = new RTCPeerConnection({ iceServers });
const origDataChannel = sender.createDataChannel("remote-control");
let dupDataChannel = null;
let localStream = null;

function playVideo() {
  const originalVideo = document.getElementById("original");
  if (!localStream) {
    localStream = originalVideo.captureStream();
    sender.addTrack(localStream.getVideoTracks()[0], localStream);
  }
  originalVideo.play();
}

document
  .getElementById("origStartButton")
  .addEventListener("click", function (event) {
    event.preventDefault();
    playVideo();
  });

document
  .getElementById("origPauseButton")
  .addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById("original").pause();
  });

document
  .getElementById("dupStartButton")
  .addEventListener("click", function (event) {
    event.preventDefault();
    dupDataChannel.send("start");
  });

document
  .getElementById("dupPauseButton")
  .addEventListener("click", function (event) {
    event.preventDefault();
    dupDataChannel.send("pause");
  });

origDataChannel.addEventListener("message", (event) => {
  const msg = event.data;
  console.log("Received message: " + msg);
  if (msg === "start") {
    playVideo();
  } else if (msg === "pause") {
    document.getElementById("original").pause();
  }
});

receiver.addEventListener("datachannel", function (event) {
  dupDataChannel = event.channel;

  dupDataChannel.addEventListener("open", () => {
    document.getElementById("remoteControl").style.display = "flex";
  });

  dupDataChannel.addEventListener("message", function (event) {
    const msg = event.data;
    console.log(msg);
  });
});

sender.addEventListener("icecandidate", (event) => {
  if (event.candidate) {
    receiver.addIceCandidate(event.candidate);
  }
});
receiver.addEventListener("icecandidate", (event) => {
  if (event.candidate) {
    sender.addIceCandidate(event.candidate);
  }
});

sender.addEventListener("negotiationneeded", () => {
  // Create offer
  sender
    .createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    })
    .then((offer) => {
      // Set local description with offer and send Offer to receiver
      sender.setLocalDescription(offer);
      return offer;
    })
    .then((offerReceived) => {
      // Receive offer from sender and set remote description and create answer
      receiver.setRemoteDescription(offerReceived);
      return receiver.createAnswer();
    })
    .then((answer) => {
      // Set local description with answer and send answer to sender
      receiver.setLocalDescription(answer);
      return answer;
    })
    .then((answerReceived) => {
      // Receive answer from receiver and set remote description
      sender.setRemoteDescription(answerReceived);
    });
});

receiver.addEventListener("track", (event) => {
  const dupVideo = document.getElementById("duplicate");
  dupVideo.srcObject = event.streams[0];
  dupVideo.play();
});
