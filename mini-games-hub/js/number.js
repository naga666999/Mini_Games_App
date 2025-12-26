let randomNumber = Math.floor(Math.random() * 100) + 1;
let attempts = 0;
let seconds = 0;
let timerInterval;

const successSound = document.getElementById("successSound");
const wrongSound = document.getElementById("wrongSound");
const clickSound = document.getElementById("clickSound");

startTimer();
loadBestScore();

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = `⏱ ${seconds}s`;
  }, 1000);
}

function checkGuess() {
  clickSound.play();

  const guess = Number(document.getElementById("guessInput").value);
  const message = document.getElementById("message");

  if (!guess || guess < 1 || guess > 100) {
    message.textContent = "❗ Enter 1–100";
    return;
  }

  attempts++;
  document.getElementById("attempts").textContent = "Attempts: " + attempts;

  if (guess === randomNumber) {
    successSound.play();
    clearInterval(timerInterval);
    message.textContent = "🎉 You guessed correctly!";
    saveBestScore();
  } else {
    wrongSound.play();
    message.textContent = guess < randomNumber ? "📉 Too Low!" : "📈 Too High!";
  }
}

function resetGame() {
  clickSound.play();
  randomNumber = Math.floor(Math.random() * 100) + 1;
  attempts = 0;
  seconds = 0;
  document.getElementById("attempts").textContent = "Attempts: 0";
  document.getElementById("message").textContent = "";
  document.getElementById("guessInput").value = "";
  clearInterval(timerInterval);
  startTimer();
}

function saveBestScore() {
  const best = localStorage.getItem("bestScore");
  if (!best || attempts < best) {
    localStorage.setItem("bestScore", attempts);
  }
  loadBestScore();
}

function loadBestScore() {
  const best = localStorage.getItem("bestScore");
  if (best) {
    document.getElementById("bestScore").textContent = "🏆 Best Score: " + best;
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}
