const localVideo = document.getElementById("localVideo");
const sender = new RTCPeerConnection({
  iceServers: undefined,
});
const receiver = new RTCPeerConnection({
  iceServers: undefined,
});
let senderDataChannel;
let receiverDataChannel;

let flux;
localVideo.addEventListener("play", (e) => {
  if (!flux) {
    flux = e.target.captureStream();
    flux.getTracks().forEach((track) => sender.addTrack(track, flux));
  }
});

sender.addEventListener("icecandidate", (e) => {
  if (e.candidate) {
    receiver.addIceCandidate(e.candidate);
  }
});
receiver.addEventListener("icecandidate", (e) => {
  if (e.candidate) {
    sender.addIceCandidate(e.candidate);
  }
});

sender.addEventListener("negotiationneeded", async (e) => {
  senderDataChannel = sender.createDataChannel("controls");
  senderDataChannel.addEventListener("message", (e) => {
    const { action } = JSON.parse(e.data);
    switch (action) {
      case "pause":
        localVideo.pause();
        break;
      case "play":
        localVideo.play();
        break;
    }
  });

  const offer = await sender.createOffer();
  await sender.setLocalDescription(offer);

  await receiver.setRemoteDescription(offer);
  const answer = await receiver.createAnswer();
  await receiver.setLocalDescription(answer);

  await sender.setRemoteDescription(answer);
});

const receivedStreams = [];
receiver.addEventListener("track", (e) => {
  e.streams.forEach((stream) => {
    if (receivedStreams.includes(stream.id)) return;
    const container = document.createElement("div");

    const button = document.createElement("button");
    button.innerText = "Pause";
    button.addEventListener("click", (e) => {
      const currentValue = e.target.innerText.trim().toLowerCase();
      receiverDataChannel.send(
        JSON.stringify({
          action: currentValue,
        })
      );
      e.target.innerText = currentValue === "pause" ? "Play" : "Pause";
    });

    const duplicateVideo = document.createElement("video");
    duplicateVideo.srcObject = stream;
    duplicateVideo.autoplay = true;
    duplicateVideo.muted = true;
    container.appendChild(duplicateVideo);
    container.appendChild(button);
    document.body.appendChild(container);
    receivedStreams.push(stream.id);
  });
});

receiver.addEventListener("datachannel", (e) => {
  receiverDataChannel = e.channel;
});
