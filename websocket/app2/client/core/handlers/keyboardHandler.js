export default function keyboardHandler(player) {
  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      player.direction = "left";
    } else if (event.key === "ArrowRight") {
      player.direction = "right";
    } else if (event.key === "ArrowUp") {
      player.direction = "up";
    } else if (event.key === "ArrowDown") {
      player.direction = "down";
    }
  };
  window.addEventListener("keydown", handleKeyDown);

  const handleKeyUp = (_) => {
    player.direction = "none";
  };

  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}
