/**
 * MAGMA CORE - STABLE RELEASE
 */

// --- THEMES & CONFIG ---
const THEMES = [
  {
    name: "MAGMA",
    primary: "#ff5e00",
    secondary: "#ffae00",
    dark: "#800000",
    bg: "#1a0500",
  },
  {
    name: "NEON",
    primary: "#00f3ff",
    secondary: "#0066ff",
    dark: "#000080",
    bg: "#00051a",
  },
  {
    name: "TOXIC",
    primary: "#00ff41",
    secondary: "#ccff00",
    dark: "#004d00",
    bg: "#001a05",
  },
  {
    name: "SOLAR",
    primary: "#ffd700",
    secondary: "#ffffff",
    dark: "#b8860b",
    bg: "#1a1a00",
  },
  {
    name: "VOID",
    primary: "#aa00ff",
    secondary: "#ff00ff",
    dark: "#4b0082",
    bg: "#0a001a",
  },
];

const COLORS = { keys: { r: "#ff3d00", g: "#00e676", b: "#2979ff" } };

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class Ambience {
  constructor() {
    this.ctx = audioCtx;
    this.nodes = [];
    this.isPlaying = false;
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.createOscillator(55, "sawtooth", 0.05);
    this.createOscillator(110, "triangle", 0.03);
  }

  createOscillator(freq, type, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.nodes.push(osc);
  }

  toggle(isOn) {
    if (isOn) {
      if (!this.isPlaying) this.start();
      this.ctx.resume();
      this.masterGain.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.5);
    } else {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
  }
}

const Sound = {
  playTone: (freq, type, duration) => {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  },
  move: () => Sound.playTone(150, "triangle", 0.05),
  pickup: () => Sound.playTone(600, "sine", 0.1),
  unlock: () => Sound.playTone(300, "sawtooth", 0.2),
  powerUp: () => Sound.playTone(400, "square", 0.2),
  deny: () => Sound.playTone(100, "sawtooth", 0.2),
  win: () => Sound.playTone(500, "sine", 0.3),
  die: () => Sound.playTone(80, "sawtooth", 0.4),
};

// --- ALGORITHMS ---
class MazeGenerator {
  static generate(width, height) {
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    let grid = [];
    for (let y = 0; y < height; y++) {
      let row = [];
      for (let x = 0; x < width; x++) {
        row.push({ x, y, type: "wall", isOpen: true, visited: false });
      }
      grid.push(row);
    }

    let current = grid[1][1];
    current.visited = true;
    current.type = "empty";
    let stack = [current];

    while (stack.length > 0) {
      let neighbors = [];
      let { x, y } = current;
      let dirs = [
        [0, -2],
        [0, 2],
        [-2, 0],
        [2, 0],
      ];

      for (let d of dirs) {
        let nx = x + d[0];
        let ny = y + d[1];
        if (
          nx > 0 &&
          nx < width - 1 &&
          ny > 0 &&
          ny < height - 1 &&
          !grid[ny][nx].visited
        ) {
          neighbors.push({ node: grid[ny][nx], dir: d });
        }
      }

      if (neighbors.length > 0) {
        let next = neighbors[Math.floor(Math.random() * neighbors.length)];
        let midX = x + next.dir[0] / 2;
        let midY = y + next.dir[1] / 2;
        grid[midY][midX].type = "empty";
        next.node.type = "empty";
        next.node.visited = true;
        stack.push(current);
        current = next.node;
      } else {
        current = stack.pop();
      }
    }
    return grid;
  }
}

class AStar {
  static findPath(grid, start, end) {
    let openSet = [start];
    let closedSet = [];

    // Reset pathfinding props
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        grid[r][c].f = 0;
        grid[r][c].g = 0;
        grid[r][c].h = 0;
        grid[r][c].parent = null;
      }
    }

    while (openSet.length > 0) {
      let winner = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[winner].f) winner = i;
      }
      let current = openSet[winner];

      if (current === end) {
        let path = [];
        let temp = current;
        while (temp.parent) {
          path.push(temp);
          temp = temp.parent;
        }
        return path.reverse();
      }

      openSet.splice(winner, 1);
      closedSet.push(current);

      let neighbors = [];
      let { x, y } = current;
      if (x < grid[0].length - 1) neighbors.push(grid[y][x + 1]);
      if (x > 0) neighbors.push(grid[y][x - 1]);
      if (y < grid.length - 1) neighbors.push(grid[y + 1][x]);
      if (y > 0) neighbors.push(grid[y - 1][x]);

      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        if (
          closedSet.includes(neighbor) ||
          neighbor.type === "wall" ||
          (neighbor.type === "door" && !neighbor.isOpen)
        )
          continue;

        let tempG = current.g + 1;
        let newPath = false;
        if (openSet.includes(neighbor)) {
          if (tempG < neighbor.g) {
            neighbor.g = tempG;
            newPath = true;
          }
        } else {
          neighbor.g = tempG;
          newPath = true;
          openSet.push(neighbor);
        }

        if (newPath) {
          neighbor.h =
            Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
        }
      }
    }
    return [];
  }
}

// --- GAME CLASS ---
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.level = 1;
    this.grid = [];
    this.player = {
      x: 1,
      y: 1,
      rotation: 0,
      inventory: [],
      freezeCharges: 3,
      ghostCharges: 3,
    };
    this.enemies = [];
    this.tileSize = 20;
    this.isRunning = false;
    this.soundEnabled = true;
    this.ambience = new Ambience();
    this.currentTheme = THEMES[0];

    this.ui = {
      level: document.getElementById("level-display"),
      time: document.getElementById("time-display"),
      keys: document.getElementById("keys-display"),
      soundBtn: document.getElementById("btn-sound"),
      start: document.getElementById("start-screen"),
      gameOver: document.getElementById("game-over-screen"),
      levelComplete: document.getElementById("level-complete-screen"),
    };

    this.initInput();
    this.loadProgress();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  initInput() {
    window.addEventListener("keydown", (e) => this.handleInput(e.key));

    document.querySelectorAll(".d-btn").forEach((btn) => {
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.handleInput(btn.dataset.key);
      });
      btn.addEventListener("click", () => this.handleInput(btn.dataset.key));
    });

    document.getElementById("start-btn").addEventListener("click", () => {
      if (audioCtx.state === "suspended") audioCtx.resume();
      this.ambience.start();
      this.startLevel();
    });

    document.getElementById("next-level-btn").addEventListener("click", () => {
      this.level++;
      this.startLevel();
    });
    document
      .getElementById("restart-level-btn")
      .addEventListener("click", () => this.startLevel());
    document.getElementById("reset-save-btn").addEventListener("click", () => {
      localStorage.clear();
      location.reload();
    });

    document
      .getElementById("btn-freeze")
      .addEventListener("click", () => this.activatePower("freeze"));
    document
      .getElementById("btn-ghost")
      .addEventListener("click", () => this.activatePower("ghost"));

    this.ui.soundBtn.addEventListener("click", () => {
      this.soundEnabled = !this.soundEnabled;
      this.ui.soundBtn.innerText = this.soundEnabled ? "🔊 ON" : "🔇 OFF";
      this.ambience.toggle(this.soundEnabled);
    });
  }

  handleInput(key) {
    if (!this.isRunning) return;
    key = key.toLowerCase();

    let dx = 0,
      dy = 0;
    if (key === "arrowup" || key === "w") dy = -1;
    if (key === "arrowdown" || key === "s") dy = 1;
    if (key === "arrowleft" || key === "a") dx = -1;
    if (key === "arrowright" || key === "d") dx = 1;

    if (key === "q") this.activatePower("freeze");
    if (key === "e") this.activatePower("ghost");

    if (dx !== 0 || dy !== 0) {
      // Rotation
      if (dx === 1) this.player.rotation = 0;
      if (dx === -1) this.player.rotation = Math.PI;
      if (dy === 1) this.player.rotation = Math.PI / 2;
      if (dy === -1) this.player.rotation = -Math.PI / 2;

      this.movePlayer(dx, dy);
    }
  }

  activatePower(type) {
    if (type === "freeze") {
      if (this.player.freezeCooldown > 0 || this.player.freezeCharges <= 0) {
        if (this.soundEnabled) Sound.deny();
        return;
      }
      this.player.freezeCharges--;
      this.player.freezeActive = true;
      this.player.freezeTimer = 180;
      this.player.freezeCooldown = 900;
    }
    if (type === "ghost") {
      if (this.player.ghostCooldown > 0 || this.player.ghostCharges <= 0) {
        if (this.soundEnabled) Sound.deny();
        return;
      }
      this.player.ghostCharges--;
      this.player.ghostActive = true;
      this.player.ghostTimer = 180;
      this.player.ghostCooldown = 600;
    }
    if (this.soundEnabled) Sound.powerUp();
    this.updatePowerUI();
  }

  updatePowerUI() {
    document.getElementById("count-freeze").innerText =
      this.player.freezeCharges;
    document.getElementById("count-ghost").innerText = this.player.ghostCharges;

    // Visual opacity for empty/full
    const btnFreeze = document.getElementById("btn-freeze").parentElement;
    const btnGhost = document.getElementById("btn-ghost").parentElement;

    btnFreeze.style.opacity = this.player.freezeCharges > 0 ? 1 : 0.5;
    btnGhost.style.opacity = this.player.ghostCharges > 0 ? 1 : 0.5;
  }

  applyTheme() {
    const themeIndex = Math.floor((this.level - 1) / 5) % THEMES.length;
    this.currentTheme = THEMES[themeIndex];

    const root = document.documentElement;
    root.style.setProperty("--theme-primary", this.currentTheme.primary);
    root.style.setProperty("--theme-secondary", this.currentTheme.secondary);
    root.style.setProperty("--theme-dark", this.currentTheme.dark);
  }

  startLevel() {
    this.applyTheme();
    Object.values(this.ui).forEach((el) => {
      if (el.classList && !el.id.includes("btn")) el.classList.remove("active");
    });

    // Calculate Aspect Ratio Maze
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    const ratio = w / h;
    let base = 225 + this.level * 10;
    let rows = Math.round(Math.sqrt(base / ratio));
    if (rows % 2 === 0) rows++;
    let cols = Math.round(rows * ratio);
    if (cols % 2 === 0) cols++;

    // Safety clamps
    rows = Math.max(7, rows);
    cols = Math.max(7, cols);

    this.grid = MazeGenerator.generate(cols, rows);
    this.resize();

    let empty = [];
    this.grid.forEach((r) =>
      r.forEach((c) => {
        if (c.type === "empty") empty.push(c);
      })
    );

    this.player = {
      x: 1,
      y: 1,
      rotation: 0,
      inventory: [],
      freezeCharges: 3,
      ghostCharges: 3,
      freezeTimer: 0,
      ghostTimer: 0,
      freezeCooldown: 0,
      ghostCooldown: 0,
      freezeActive: false,
      ghostActive: false,
    };

    this.updatePowerUI();

    let exit = empty[empty.length - 2];
    this.grid[exit.y][exit.x].type = "exit";

    this.enemies = [];
    let count = Math.floor(this.level / 5) + 1;
    for (let i = 0; i < count; i++) {
      let s = empty[Math.floor(Math.random() * empty.length)];
      if (Math.abs(s.x - 1) > 5) {
        this.enemies.push({
          x: s.x,
          y: s.y,
          type: Math.random() > 0.5 ? "chaser" : "patrol",
          grid: this.grid,
          path: [],
          tick: 0,
        });
      }
    }

    if (this.level > 5) this.addKey("r", empty);
    if (this.level > 15) this.addKey("g", empty);
    if (this.level > 25) this.addKey("b", empty);

    this.startTime = Date.now();
    this.isRunning = true;
    this.ui.level.innerText = this.level;
    this.ui.keys.innerHTML = "";
    this.gameLoop();
  }

  addKey(color, empty) {
    let k = empty[Math.floor(Math.random() * empty.length)];
    this.grid[k.y][k.x].type = "key";
    this.grid[k.y][k.x].color = color;

    let d = empty[Math.floor(Math.random() * empty.length)];
    // Ensure door isn't on player or key
    while ((d.x === k.x && d.y === k.y) || (d.x === 1 && d.y === 1)) {
      d = empty[Math.floor(Math.random() * empty.length)];
    }
    this.grid[d.y][d.x].type = "door";
    this.grid[d.y][d.x].color = color;
    this.grid[d.y][d.x].isOpen = false;
  }

  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    if (this.grid.length) {
      let mw = this.canvas.width / this.grid[0].length;
      let mh = this.canvas.height / this.grid.length;
      this.tileSize = Math.floor(Math.min(mw, mh));
      this.offsetX =
        (this.canvas.width - this.grid[0].length * this.tileSize) / 2;
      this.offsetY =
        (this.canvas.height - this.grid.length * this.tileSize) / 2;
    }
    if (this.isRunning) this.draw();
  }

  movePlayer(dx, dy) {
    let nx = this.player.x + dx;
    let ny = this.player.y + dy;

    if (ny < 0 || ny >= this.grid.length || nx < 0 || nx >= this.grid[0].length)
      return;

    let cell = this.grid[ny][nx];

    if (cell.type === "wall" && !this.player.ghostActive) return;
    if (cell.type === "door" && !cell.isOpen && !this.player.ghostActive) {
      if (this.player.inventory.includes(cell.color)) {
        cell.isOpen = true;
        if (this.soundEnabled) Sound.unlock();
      } else {
        return;
      }
    }

    this.player.x = nx;
    this.player.y = ny;
    if (this.soundEnabled) Sound.move();

    if (cell.type === "key") {
      this.player.inventory.push(cell.color);
      cell.type = "empty";
      if (this.soundEnabled) Sound.pickup();
      this.ui.keys.innerHTML += `<span class='key-icon' style='background:${
        COLORS.keys[cell.color]
      }'></span>`;
    }

    if (cell.type === "exit") this.levelComplete();
  }

  gameLoop() {
    if (!this.isRunning) return;

    // Timers
    if (this.player.freezeActive) {
      this.player.freezeTimer--;
      if (this.player.freezeTimer <= 0) this.player.freezeActive = false;
    }
    if (this.player.freezeCooldown > 0) this.player.freezeCooldown--;

    if (this.player.ghostActive) {
      this.player.ghostTimer--;
      if (this.player.ghostTimer <= 0) this.player.ghostActive = false;
    }
    if (this.player.ghostCooldown > 0) this.player.ghostCooldown--;

    // Update Cooldown Visuals
    document.getElementById("cd-freeze").style.height =
      (this.player.freezeCooldown / 900) * 100 + "%";
    document.getElementById("cd-ghost").style.height =
      (this.player.ghostCooldown / 600) * 100 + "%";

    let t = Math.floor((Date.now() - this.startTime) / 1000);
    this.ui.time.innerText = `${Math.floor(t / 60)
      .toString()
      .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;

    // Enemies
    if (!this.player.freezeActive) {
      this.enemies.forEach((e) => {
        e.tick++;
        if (e.tick < (e.type === "chaser" ? 20 : 30)) return;
        e.tick = 0;

        if (e.type === "chaser") {
          let p = AStar.findPath(
            this.grid,
            this.grid[e.y][e.x],
            this.grid[this.player.y][this.player.x]
          );
          if (p.length) {
            e.x = p[0].x;
            e.y = p[0].y;
          }
        } else {
          let nx = e.x + (e.patrolDir || 1);
          if (this.grid[e.y][nx] && this.grid[e.y][nx].type === "empty")
            e.x = nx;
          else e.patrolDir = (e.patrolDir || 1) * -1;
        }

        if (e.x === this.player.x && e.y === this.player.y) {
          this.isRunning = false;
          if (this.soundEnabled) Sound.die();
          this.ui.gameOver.classList.add("active");
        }
      });
    }

    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  draw() {
    const ctx = this.ctx;
    const ts = this.tileSize;
    const T = this.currentTheme;

    // Dynamic Background
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid
    this.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        let px = this.offsetX + x * ts;
        let py = this.offsetY + y * ts;

        if (cell.type === "wall") {
          ctx.globalAlpha = this.player.ghostActive ? 0.3 : 1;
          let g = ctx.createLinearGradient(px, py, px + ts, py + ts);
          g.addColorStop(0, T.dark);
          g.addColorStop(1, T.primary);
          ctx.fillStyle = g;
          ctx.fillRect(px, py, ts, ts);

          ctx.strokeStyle = T.secondary;
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, ts, ts);
          ctx.globalAlpha = 1;
        } else if (cell.type === "exit") {
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.5;
          ctx.fillRect(px, py, ts, ts);
          ctx.globalAlpha = 1;
        } else if (cell.type === "key") {
          ctx.fillStyle = COLORS.keys[cell.color];
          ctx.beginPath();
          ctx.arc(px + ts / 2, py + ts / 2, ts / 3, 0, 6.28);
          ctx.fill();
        } else if (cell.type === "door" && !cell.isOpen) {
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = COLORS.keys[cell.color];
          ctx.lineWidth = 3;
          ctx.strokeRect(px + 2, py + 2, ts - 4, ts - 4);
        }
      });
    });

    // --- DRAW PLAYER DRONE ---
    let px = this.offsetX + this.player.x * ts + ts / 2;
    let py = this.offsetY + this.player.y * ts + ts / 2;
    let sz = ts * 0.8;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.player.rotation);

    // Drone Body
    ctx.fillStyle = this.player.ghostActive
      ? "#fff"
      : this.player.freezeActive
      ? "#00f3ff"
      : T.secondary;
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;

    ctx.beginPath();
    ctx.moveTo(sz / 2, 0);
    ctx.lineTo(-sz / 2, sz / 2);
    ctx.lineTo(-sz / 2, -sz / 2);
    ctx.fill();

    // Ring
    ctx.rotate(-this.player.rotation + Date.now() / 100);
    ctx.strokeStyle = T.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Draw Enemies
    this.enemies.forEach((e) => {
      let ex = this.offsetX + e.x * ts + ts / 2;
      let ey = this.offsetY + e.y * ts + ts / 2;
      ctx.fillStyle = this.player.freezeActive ? "#00f3ff" : "#ff0000";
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(ex, ey, ts / 3, 0, 6.28);
      ctx.fill();
    });
  }

  levelComplete() {
    this.isRunning = false;
    if (this.soundEnabled) Sound.win();
    let t = (Date.now() - this.startTime) / 1000;
    let r = t < 30 ? "⭐⭐⭐" : "⭐⭐";
    let s = JSON.parse(localStorage.getItem("neonMazeSave") || "{}");
    s.level = this.level + 1;
    s.scores = s.scores || {};
    s.scores[this.level] = t;
    localStorage.setItem("neonMazeSave", JSON.stringify(s));
    document.getElementById("lc-time").innerText = t.toFixed(1) + "s";
    document.getElementById("lc-stars").innerText = r;
    this.ui.levelComplete.classList.add("active");
  }

  loadProgress() {
    let s = JSON.parse(localStorage.getItem("neonMazeSave") || "{}");
    if (s.level) this.level = s.level;
    let h = "<h3>RECORDS</h3>";
    for (let l in s.scores) h += `<div>Lvl ${l}: ${s.scores[l]}s</div>`;
    document.getElementById("leaderboard-preview").innerHTML = h;
  }
}

// Start Game
window.onload = () => new Game();
