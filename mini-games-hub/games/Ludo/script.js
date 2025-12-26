/* LUDO PRO - UPGRADED LOGIC */

const players = ["red", "green", "yellow", "blue"];
let activePlayers = []; // Stores indices of active players
let totalPlayers = 4;
let turn = 0; // Index in activePlayers array
let currentPayload = 0; // Actual player index (0-3)
let diceValue = 0;
let hasRolled = false;
let canRoll = true;

// Sounds
const sounds = {
  dice: new Audio("sounds/dice.mp3"),
  move: new Audio("sounds/move.mp3"),
  kill: new Audio("sounds/kill.mp3"),
  win: new Audio("sounds/win.mp3"),
};
const playSound = (key) => {
  try {
    sounds[key].currentTime = 0;
    sounds[key].play().catch(() => {});
  } catch (e) {}
};

// State: -1 (base), 0-50 (path), 51-56 (home), 57 (done)
const tokens = [
  [
    { id: 0, pos: -1 },
    { id: 1, pos: -1 },
    { id: 2, pos: -1 },
    { id: 3, pos: -1 },
  ], // Red
  [
    { id: 0, pos: -1 },
    { id: 1, pos: -1 },
    { id: 2, pos: -1 },
    { id: 3, pos: -1 },
  ], // Green
  [
    { id: 0, pos: -1 },
    { id: 1, pos: -1 },
    { id: 2, pos: -1 },
    { id: 3, pos: -1 },
  ], // Yellow
  [
    { id: 0, pos: -1 },
    { id: 1, pos: -1 },
    { id: 2, pos: -1 },
    { id: 3, pos: -1 },
  ], // Blue
];

// --- START GAME LOGIC ---
function startGame(count) {
  totalPlayers = count;
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-root").classList.remove("hidden");

  // Determine active players based on count
  if (count === 2) {
    activePlayers = [0, 2]; // Red vs Yellow (Opposite)
    // Hide unused UI
    document.getElementById("player-1-card").style.display = "none";
    document.getElementById("player-3-card").style.display = "none";
  } else if (count === 3) {
    activePlayers = [0, 1, 2];
    document.getElementById("player-3-card").style.display = "none";
  } else {
    activePlayers = [0, 1, 2, 3];
  }

  currentPayload = activePlayers[0];
  initBoard();
  updateUI();
}

// --- BOARD SETUP ---
const boardEl = document.getElementById("ludo-board");

function initBoard() {
  boardEl.innerHTML = "";

  // Bases
  const bases = [
    { c: "red", r: "1/7", col: "1/7", id: "base-0" },
    { c: "green", r: "1/7", col: "10/16", id: "base-1" },
    { c: "blue", r: "10/16", col: "1/7", id: "base-3" },
    { c: "yellow", r: "10/16", col: "10/16", id: "base-2" },
  ];

  bases.forEach((b) => {
    const base = document.createElement("div");
    base.className = `base ${b.c}`;
    base.style.gridRow = b.r;
    base.style.gridColumn = b.col;
    base.innerHTML = `
            <div class="base-box">
                <div class="base-circle" id="base-${b.c}-0"></div>
                <div class="base-circle" id="base-${b.c}-1"></div>
                <div class="base-circle" id="base-${b.c}-2"></div>
                <div class="base-circle" id="base-${b.c}-3"></div>
            </div>`;
    boardEl.appendChild(base);
  });

  // Center
  const center = document.createElement("div");
  center.className = "home-center";
  center.innerHTML = `<div class="tri tri-red"></div><div class="tri tri-green"></div><div class="tri tri-yellow"></div><div class="tri tri-blue"></div>`;
  boardEl.appendChild(center);

  // Path Cells
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (
        (r < 6 && c < 6) ||
        (r < 6 && c > 8) ||
        (r > 8 && c < 6) ||
        (r > 8 && c > 8) ||
        (r >= 6 && r <= 8 && c >= 6 && c <= 8)
      )
        continue;
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${r}-${c}`;

      // Safe & Path Colors
      if (r === 6 && c === 1) cell.classList.add("safe-star", "path-red");
      if (r === 1 && c === 8) cell.classList.add("safe-star", "path-green");
      if (r === 8 && c === 13) cell.classList.add("safe-star", "path-yellow");
      if (r === 13 && c === 6) cell.classList.add("safe-star", "path-blue");
      if (r === 7 && c > 0 && c < 6) cell.classList.add("path-red");
      if (c === 7 && r > 0 && r < 6) cell.classList.add("path-green");
      if (r === 7 && c > 8 && c < 14) cell.classList.add("path-yellow");
      if (c === 7 && r > 8 && r < 14) cell.classList.add("path-blue");

      cell.style.gridRow = r + 1;
      cell.style.gridColumn = c + 1;
      boardEl.appendChild(cell);
    }
  }
  renderTokens();
}

// Path Logic
const getPath = (playerIdx) => {
  const mainPath = [
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [5, 6],
    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [6, 9],
    [6, 10],
    [6, 11],
    [6, 12],
    [6, 13],
    [6, 14],
    [7, 14],
    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    [14, 6],
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 6],
    [8, 5],
    [8, 4],
    [8, 3],
    [8, 2],
    [8, 1],
    [8, 0],
    [7, 0],
  ];
  const offset = playerIdx * 13;
  let specificPath = [];
  for (let i = 0; i < 51; i++) specificPath.push(mainPath[(offset + i) % 52]);

  const homePaths = [
    [
      [7, 1],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
      [7, 6],
    ],
    [
      [1, 7],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
    ],
    [
      [7, 13],
      [7, 12],
      [7, 11],
      [7, 10],
      [7, 9],
      [7, 8],
    ],
    [
      [13, 7],
      [12, 7],
      [11, 7],
      [10, 7],
      [9, 7],
      [8, 7],
    ],
  ];
  return specificPath.concat(homePaths[playerIdx]);
};

// --- GAME ACTIONS ---
const diceBtn = document.getElementById("dice-btn");
const instruct = document.getElementById("instruction-text");

diceBtn.addEventListener("click", () => {
  if (!canRoll || hasRolled) return;
  rollDice();
});

function rollDice() {
  canRoll = false;
  playSound("dice");

  // 3D Animation Trigger
  diceBtn.classList.add("rolling");
  instruct.innerText = "Rolling...";

  setTimeout(() => {
    diceBtn.classList.remove("rolling");
    diceValue = Math.floor(Math.random() * 6) + 1;

    // Update visual dice face
    updateDiceFace(diceValue);

    hasRolled = true;
    checkMovePossibilities();
  }, 600);
}

function updateDiceFace(val) {
  const face = document.querySelector(".side.front");
  const map = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };
  face.innerText = map[val];
}

function checkMovePossibilities() {
  const pIdx = currentPayload; // Current active player color index
  const playerTokens = tokens[pIdx];
  let movableCount = 0;

  playerTokens.forEach((token) => {
    token.el = document.getElementById(`t-${pIdx}-${token.id}`);
    if (token.el) token.el.classList.remove("clickable");

    let canMove = false;
    if (token.pos === -1) {
      if (diceValue === 6) canMove = true;
    } else if (token.pos + diceValue <= 56) {
      canMove = true;
    }

    if (canMove && token.pos !== 57) {
      movableCount++;
      if (token.el) {
        token.el.classList.add("clickable");
        token.el.onclick = () => moveToken(token);
      }
    } else {
      if (token.el) token.el.onclick = null;
    }
  });

  if (movableCount === 0) {
    instruct.innerText = `No moves for ${players[
      pIdx
    ].toUpperCase()}. Skipping...`;
    setTimeout(nextTurn, 1000);
  } else {
    instruct.innerText = `${players[pIdx].toUpperCase()}: Select a token`;
  }
}

async function moveToken(token) {
  const pIdx = currentPayload;
  tokens[pIdx].forEach((t) => {
    const el = document.getElementById(`t-${pIdx}-${t.id}`);
    if (el) {
      el.classList.remove("clickable");
      el.onclick = null;
    }
  });

  const path = getPath(pIdx);

  if (token.pos === -1) {
    token.pos = 0;
    renderTokens();
    playSound("move");
    hasRolled = false;
    canRoll = true;
    instruct.innerText = "Token Out! Roll Again.";
    return;
  }

  for (let i = 1; i <= diceValue; i++) {
    token.pos++;
    renderTokens();
    playSound("move");
    await new Promise((r) => setTimeout(r, 200));
  }

  checkCollision(token, pIdx);

  if (token.pos === 56) {
    token.pos = 57;
    playSound("win");
    checkWin(pIdx);
    hasRolled = false;
    canRoll = true;
    return;
  }

  if (diceValue === 6) {
    hasRolled = false;
    canRoll = true;
    instruct.innerText = "Rolled a 6! Roll again.";
  } else {
    nextTurn();
  }
}

function checkCollision(activeToken, pIdx) {
  const path = getPath(pIdx);
  const curr = path[activeToken.pos];
  const r = curr[0],
    c = curr[1];

  const isSafe =
    (r == 6 && c == 1) ||
    (r == 1 && c == 8) ||
    (r == 8 && c == 13) ||
    (r == 13 && c == 6) ||
    (r == 6 && c == 2) ||
    (r == 8 && c == 12) ||
    (r == 2 && c == 6) ||
    (r == 12 && c == 8);

  if (isSafe) return;

  // Check against active players only
  activePlayers.forEach((enemyIdx) => {
    if (enemyIdx === pIdx) return;
    tokens[enemyIdx].forEach((enemy) => {
      if (enemy.pos > -1 && enemy.pos < 51) {
        const ePath = getPath(enemyIdx);
        const eCoord = ePath[enemy.pos];
        if (eCoord[0] === r && eCoord[1] === c) {
          enemy.pos = -1; // Kill
          playSound("kill");
          instruct.innerText = "Captured!";
        }
      }
    });
  });
  renderTokens();
}

function checkWin(pIdx) {
  const finished = tokens[pIdx].filter((t) => t.pos === 57).length;
  if (finished === 4) {
    document.getElementById("win-modal").classList.remove("hidden");
    document.getElementById("winner-name").innerText =
      players[pIdx].toUpperCase() + " WINS!";
  }
}

function nextTurn() {
  turn = (turn + 1) % activePlayers.length;
  currentPayload = activePlayers[turn];

  diceValue = 0;
  hasRolled = false;
  canRoll = true;
  updateUI();
}

function updateUI() {
  document
    .querySelectorAll(".player-card")
    .forEach((el) => el.classList.remove("active"));
  document
    .getElementById(`player-${currentPayload}-card`)
    .classList.add("active");

  document.querySelector(".side.front").innerText = "🎲";
  instruct.innerText = `${players[currentPayload].toUpperCase()}'s Turn`;

  // Rotate dice cube to show whose turn it is (visual flair)
  // Optional: Change dice color based on player?
  const diceCube = document.getElementById("dice-btn");
  diceCube.style.transform = `rotateY(${turn * 90}deg)`;
}
// --- BACKGROUND MUSIC LOGIC ---
const bgMusic = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-btn");

// Update your existing startGame function to include music trigger
// Find your existing startGame function and add these lines inside it:
/* function startGame(count) {
        // ... existing code ...
        
        // ADD THIS:
        playBackgroundMusic();
        musicBtn.classList.remove('hidden'); // Show the button
    }
*/

function playBackgroundMusic() {
  bgMusic.volume = 0.3; // Set volume to 30% (so it's not too loud)
  bgMusic.play().catch((error) => {
    console.log(
      "Auto-play was prevented by browser. User must interact first."
    );
  });
}

// Toggle Button Logic
musicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.innerText = "🎵"; // Note icon
    musicBtn.style.opacity = "1";
  } else {
    bgMusic.pause();
    musicBtn.innerText = "🔇"; // Mute icon
    musicBtn.style.opacity = "0.6";
  }
});

function renderTokens() {
  document.querySelectorAll(".token").forEach((e) => e.remove());
  // Only render active players
  activePlayers.forEach((pIdx) => {
    const path = getPath(pIdx);
    tokens[pIdx].forEach((t) => {
      const tokenEl = document.createElement("div");
      tokenEl.className = `token ${players[pIdx]}`;
      tokenEl.id = `t-${pIdx}-${t.id}`;

      if (t.pos === -1) {
        const baseCell = document.getElementById(
          `base-${players[pIdx]}-${t.id}`
        );
        if (baseCell) baseCell.appendChild(tokenEl);
      } else if (t.pos !== 57) {
        const coord = path[t.pos];
        const cell = document.getElementById(`cell-${coord[0]}-${coord[1]}`);
        if (cell) cell.appendChild(tokenEl);
      }
    });
  });
}
