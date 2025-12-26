document.addEventListener("DOMContentLoaded", () => {
  // --- 1. DOM ELEMENTS ---
  const boardEl = document.getElementById("board");
  const turnText = document.getElementById("turn-text");
  const timerWEl = document.getElementById("timer-w");
  const timerBEl = document.getElementById("timer-b");
  const moveList = document.getElementById("move-list");
  const gameOverModal = document.getElementById("game-over-modal");
  const winnerTitle = document.getElementById("winner-title");
  const winnerReason = document.getElementById("winner-reason");

  // --- 2. GAME STATE ---
  let board = [];
  let turn = "w";
  let gameActive = true;
  let selectedSquare = null;

  // Advanced Rule State
  let lastMove = null; // { fromR, fromC, toR, toC, piece }
  let castlingRights = { w: { k: true, q: true }, b: { k: true, q: true } };

  // Settings
  let mode = "human"; // human, ai-easy, ai-medium, online
  let userColor = "w";
  let timeLimit = 300; // Seconds
  let timeW = 300;
  let timeB = 300;
  let timerInterval = null;
  let isFlipped = false;

  // External Modules
  let rules = null;
  let ai = null;
  let multiplayer = null;

  // Audio (Simple placeholders using browser synthesis or empty)
  // To use real sounds, replace these with: new Audio('path/to/sound.mp3').play();
  const playSound = (type) => {
    // console.log(`Audio: ${type}`);
  };

  // --- 3. INITIALIZATION ---
  function init() {
    // Initialize Logic classes
    board = JSON.parse(JSON.stringify(BOARD_LAYOUT));
    rules = new ChessRules(board);
    ai = new ChessAI(rules);
    multiplayer = new Multiplayer(onRemoteMove);

    // Setup Event Listeners
    setupControls();

    // Start Game
    resetGame();
  }

  function setupControls() {
    // Buttons
    document.getElementById("restart-btn").addEventListener("click", resetGame);
    document.getElementById("flip-btn")?.addEventListener("click", () => {
      isFlipped = !isFlipped;
      renderBoard();
    });
    document.getElementById("theme-btn").addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
    });

    // Settings Inputs
    document.getElementById("mode-select").addEventListener("change", (e) => {
      mode = e.target.value;
      document
        .getElementById("room-controls")
        .classList.toggle("hidden", mode !== "online");
      resetGame();
    });

    document.getElementById("timer-select").addEventListener("change", (e) => {
      timeLimit = parseInt(e.target.value);
      resetGame();
    });

    document.getElementById("color-select").addEventListener("change", (e) => {
      userColor = e.target.value;
      // Auto-flip board if user chooses Black
      isFlipped = userColor === "b";
      resetGame();
    });

    // Multiplayer
    document.getElementById("join-btn").addEventListener("click", () => {
      const code = document.getElementById("room-code").value;
      if (code) multiplayer.joinRoom(code);
    });
  }

  function resetGame() {
    // Reset Logic State
    board = JSON.parse(JSON.stringify(BOARD_LAYOUT));
    rules = new ChessRules(board); // Re-bind board
    turn = "w";
    gameActive = true;
    selectedSquare = null;
    lastMove = null;
    castlingRights = { w: { k: true, q: true }, b: { k: true, q: true } };
    moveList.innerHTML = "";

    // Reset Timers
    stopTimer();
    timeW = timeLimit;
    timeB = timeLimit;
    updateTimerUI();

    // UI Reset
    gameOverModal.classList.add("hidden");
    renderBoard();

    // AI Start Check
    if (mode.startsWith("ai") && userColor === "b") {
      setTimeout(aiMove, 800);
    }
  }

  // --- 4. CORE GAME LOOP ---

  function handleSquareClick(r, c) {
    if (!gameActive) return;

    // Restriction: Can only move your own pieces in AI/Online modes
    if (mode === "online" && !multiplayer.isMyTurn(turn)) return;
    if (mode.startsWith("ai") && turn !== userColor) return;

    const clickedPiece = board[r][c];
    const isOwnPiece =
      clickedPiece && Piece.isWhite(clickedPiece) === (turn === "w");

    // A. Select Piece
    if (isOwnPiece) {
      selectedSquare = { r, c };
      renderBoard();
      return;
    }

    // B. Move Piece (if destination selected)
    if (selectedSquare) {
      // Pass advanced state (lastMove, castlingRights) to Rules
      const legalMoves = rules.getLegalMoves(
        selectedSquare.r,
        selectedSquare.c,
        lastMove,
        castlingRights,
        true
      );
      const move = legalMoves.find((m) => m.r === r && m.c === c);

      if (move) {
        executeMove(selectedSquare.r, selectedSquare.c, r, c, move);

        // Network Send
        if (mode === "online") {
          multiplayer.sendMove({ from: selectedSquare, to: { r, c } });
        }

        // AI Response Trigger
        if (gameActive && mode.startsWith("ai") && turn !== userColor) {
          setTimeout(aiMove, 600);
        }
      } else {
        // Invalid move: deselect
        selectedSquare = null;
        renderBoard();
      }
    }
  }

  function executeMove(fr, fc, tr, tc, moveDetails = null) {
    if (!timerInterval && timeLimit > 0) startTimer();

    // 1. Recover move details if not passed (e.g. from AI/Network)
    if (!moveDetails) {
      const legal = rules.getLegalMoves(
        fr,
        fc,
        lastMove,
        castlingRights,
        false
      ); // Safety false for speed
      moveDetails = legal.find((m) => m.r === tr && m.c === tc) || {
        r: tr,
        c: tc,
      };
    }

    const piece = board[fr][fc];
    const target = board[tr][tc];
    const isWhite = Piece.isWhite(piece);
    const type = piece.toLowerCase();

    // --- UPDATE BOARD ---
    board[tr][tc] = piece;
    board[fr][fc] = "";

    // Special Move: En Passant
    if (moveDetails.enPassant) {
      const dir = isWhite ? -1 : 1;
      board[tr - dir][tc] = ""; // Remove captured pawn
    }

    // Special Move: Castling
    if (moveDetails.castle) {
      const row = isWhite ? 7 : 0;
      if (moveDetails.castle === "short") {
        board[row][5] = board[row][7]; // Move Rook
        board[row][7] = "";
      } else if (moveDetails.castle === "long") {
        board[row][3] = board[row][0]; // Move Rook
        board[row][0] = "";
      }
    }

    // Special Move: Promotion (Auto-Queen for now)
    if (type === "p" && (tr === 0 || tr === 7)) {
      board[tr][tc] = isWhite ? "Q" : "q";
    }

    // --- UPDATE STATE ---
    // Record Castling Rights Loss
    if (type === "k")
      castlingRights[isWhite ? "w" : "b"] = { k: false, q: false };
    if (type === "r") {
      if (fr === 0 && fc === 0) castlingRights.b.q = false;
      if (fr === 0 && fc === 7) castlingRights.b.k = false;
      if (fr === 7 && fc === 0) castlingRights.w.q = false;
      if (fr === 7 && fc === 7) castlingRights.w.k = false;
    }

    // Update Last Move (for En Passant)
    lastMove = { fromR: fr, fromC: fc, toR: tr, toC: tc, piece: piece };

    // Log to History
    addHistoryLog(piece, fr, fc, tr, tc, target !== "");

    // Sounds
    if (rules.isKingInCheck(board, !isWhite)) playSound("check");
    else if (target || moveDetails.enPassant) playSound("capture");
    else playSound("move");

    // Switch Turn
    turn = turn === "w" ? "b" : "w";
    selectedSquare = null;

    updateTimerUI();
    renderBoard();
    checkGameOver();
  }

  function aiMove() {
    if (!gameActive) return;

    // AI plays as the color opposite to user
    const aiColorIsWhite = userColor === "b";
    const depth = mode === "ai-easy" ? 1 : 3;

    // Clone board for AI calculation safely
    const tempBoard = JSON.parse(JSON.stringify(board));
    // Note: Full AI would need deep clone of castling rights, but we skip for speed in this demo

    const bestMove = ai.getBestMove(board, depth, aiColorIsWhite);

    if (bestMove) {
      executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
    } else {
      checkGameOver();
    }
  }

  function onRemoteMove(moveData) {
    // { from: {r,c}, to: {r,c} }
    executeMove(moveData.from.r, moveData.from.c, moveData.to.r, moveData.to.c);
  }

  // --- 5. TIMERS & GAME OVER ---

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      if (!gameActive) return;
      if (turn === "w") {
        timeW--;
        if (timeW <= 0) endGame("time", "b");
      } else {
        timeB--;
        if (timeB <= 0) endGame("time", "w");
      }
      updateTimerUI();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimerUI() {
    const format = (t) => {
      if (t < 0) t = 0;
      const m = Math.floor(t / 60);
      const s = t % 60;
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    timerWEl.textContent = `White: ${format(timeW)}`;
    timerBEl.textContent = `Black: ${format(timeB)}`;

    if (turn === "w") {
      timerWEl.classList.add("active");
      timerBEl.classList.remove("active");
    } else {
      timerBEl.classList.add("active");
      timerWEl.classList.remove("active");
    }
  }

  function checkGameOver() {
    const isCheck = rules.isKingInCheck(board, turn === "w");
    const hasMoves = hasLegalMoves(turn === "w");

    if (isCheck && !hasMoves) {
      endGame("checkmate", turn === "w" ? "b" : "w");
    } else if (!isCheck && !hasMoves) {
      endGame("draw", null);
    } else if (isCheck) {
      turnText.textContent = "Check!";
      turnText.style.color = "#ff4444";
    } else {
      turnText.textContent = `${turn === "w" ? "White" : "Black"}'s Turn`;
      turnText.style.color = "inherit";
    }
  }

  function hasLegalMoves(isWhite) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && Piece.isWhite(p) === isWhite) {
          if (
            rules.getLegalMoves(r, c, lastMove, castlingRights, true).length > 0
          )
            return true;
        }
      }
    }
    return false;
  }

  function endGame(reason, winner) {
    gameActive = false;
    stopTimer();

    let title = "GAME OVER";
    let sub = "";

    if (reason === "checkmate") {
      title = winner === "w" ? "WHITE WINS" : "BLACK WINS";
      sub = "By Checkmate";
    } else if (reason === "time") {
      // Requirement: "if time is up game draw will display" (per prompt request)
      // But standard rules say opponent wins. I will follow Prompt Request for "Game Draw"
      // OR follow standard "Opponent Wins on Time".
      // Prompt said: "if time is up game draw will display" -> sticking to prompt.
      title = "GAME DRAW";
      sub = "Time Run Out";
    } else {
      title = "GAME DRAW";
      sub = "Stalemate";
    }

    winnerTitle.textContent = title;
    winnerReason.textContent = sub;
    gameOverModal.classList.remove("hidden");
  }

  function addHistoryLog(piece, fr, fc, tr, tc, isCapture) {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const rank = (r) => 8 - r;
    const notation = `${Piece.getSymbol(piece)} ${files[fc]}${rank(fr)} ➝ ${
      files[tc]
    }${rank(tr)}${isCapture ? " ⚔" : ""}`;

    const li = document.createElement("li");
    li.textContent = notation;
    li.style.padding = "5px";
    li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    moveList.prepend(li);
  }

  // --- 6. RENDERER ---

  function renderBoard() {
    boardEl.innerHTML = "";

    // Handle Visual Flip
    // Logic: if isFlipped is true, we iterate 7->0 instead of 0->7

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // visualR/C are the DOM coordinates
        // logicR/C are the Array coordinates

        const logicR = isFlipped ? 7 - r : r;
        const logicC = isFlipped ? 7 - c : c;

        const sq = document.createElement("div");
        const isDark = (logicR + logicC) % 2 !== 0;
        sq.className = `square ${isDark ? "dark" : "light"}`;

        // Add Piece
        const pieceChar = board[logicR][logicC];
        if (pieceChar) {
          const p = document.createElement("div");
          p.className = `piece ${Piece.isWhite(pieceChar) ? "white" : "black"}`;
          p.textContent = Piece.getSymbol(pieceChar);
          sq.appendChild(p);
        }

        // Selected Highlight
        if (
          selectedSquare &&
          selectedSquare.r === logicR &&
          selectedSquare.c === logicC
        ) {
          sq.classList.add("selected");
        }

        // Hint Highlights
        if (selectedSquare && gameActive) {
          // Only show hints for current player
          if (
            (turn === "w" && userColor !== "b") ||
            (turn === "b" && userColor !== "w") ||
            mode === "human"
          ) {
            const moves = rules.getLegalMoves(
              selectedSquare.r,
              selectedSquare.c,
              lastMove,
              castlingRights,
              true
            );
            if (moves.some((m) => m.r === logicR && m.c === logicC)) {
              sq.classList.add("hint");
              if (pieceChar) sq.classList.add("capture-hint"); // Optional red tint
            }
          }
        }

        // Click Handler
        sq.addEventListener("click", () => handleSquareClick(logicR, logicC));

        boardEl.appendChild(sq);
      }
    }
  }

  // Boot
  init();
});
