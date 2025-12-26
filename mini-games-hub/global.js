const clickSound = new Audio("assets/sounds/click.mp3");

document.addEventListener("click", () => {
  if (clickSound.src) {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
});
