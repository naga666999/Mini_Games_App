class ChessRules {
  constructor(board) {
    this.board = board;
  }

  // --- MAIN VALIDATION ---
  getLegalMoves(
    r,
    c,
    lastMove = null,
    castlingRights = { w: { k: false, q: false }, b: { k: false, q: false } },
    checkSafety = true
  ) {
    if (!this.isValidPos(r, c)) return [];
    const piece = this.board[r][c];
    if (!piece) return [];

    const isWhite = Piece.isWhite(piece);
    const type = piece.toLowerCase();
    let moves = [];

    // 1. Generate Pseudo-Legal Moves
    if (type === "p") moves = this.getPawnMoves(r, c, isWhite, lastMove);
    else if (type === "n")
      moves = this.getSteppingMoves(r, c, DIRECTIONS.knight, isWhite);
    else if (type === "k")
      moves = this.getKingMoves(r, c, isWhite, castlingRights);
    else if (type === "b")
      moves = this.getSlidingMoves(r, c, DIRECTIONS.diag, isWhite);
    else if (type === "r")
      moves = this.getSlidingMoves(r, c, DIRECTIONS.ortho, isWhite);
    else if (type === "q")
      moves = this.getSlidingMoves(
        r,
        c,
        [...DIRECTIONS.ortho, ...DIRECTIONS.diag],
        isWhite
      );

    // 2. Filter Illegal Moves (Self-Check)
    if (checkSafety) {
      moves = moves.filter((m) => !this.isCheckAfterMove(r, c, m, isWhite));
    }

    return moves;
  }

  // --- MOVEMENT LOGIC ---
  getPawnMoves(r, c, isWhite, lastMove) {
    let moves = [];
    const dir = isWhite ? -1 : 1; // White moves Up (Row 6->0), Black moves Down (0->7)
    const startRow = isWhite ? 6 : 1;
    const promoRow = isWhite ? 0 : 7;

    // Forward 1
    if (this.isValidPos(r + dir, c) && this.board[r + dir][c] === "") {
      moves.push({ r: r + dir, c: c, promotion: r + dir === promoRow });
      // Forward 2
      if (r === startRow && this.board[r + dir * 2][c] === "") {
        moves.push({ r: r + dir * 2, c: c, doubleStep: true });
      }
    }

    // Captures
    [c - 1, c + 1].forEach((tc) => {
      if (this.isValidPos(r + dir, tc)) {
        const target = this.board[r + dir][tc];
        // Normal Capture
        if (target && Piece.isWhite(target) !== isWhite) {
          moves.push({ r: r + dir, c: tc, promotion: r + dir === promoRow });
        }
        // En Passant
        if (!target && lastMove && lastMove.piece.toLowerCase() === "p") {
          if (
            Math.abs(lastMove.fromR - lastMove.toR) === 2 &&
            lastMove.toR === r &&
            lastMove.toC === tc
          ) {
            moves.push({ r: r + dir, c: tc, enPassant: true });
          }
        }
      }
    });
    return moves;
  }

  getKingMoves(r, c, isWhite, castlingRights) {
    let moves = this.getSteppingMoves(
      r,
      c,
      [...DIRECTIONS.ortho, ...DIRECTIONS.diag],
      isWhite
    );

    // Castling (Safe check to ensure rights exist)
    const rights = isWhite ? castlingRights?.w : castlingRights?.b;
    if (!rights) return moves;

    const row = isWhite ? 7 : 0;
    if (r !== row || c !== 4) return moves; // King must be at start

    // Cannot castle if in check
    if (this.isSquareAttacked(r, c, !isWhite)) return moves;

    // Short Castle
    if (rights.k && this.board[row][5] === "" && this.board[row][6] === "") {
      if (
        !this.isSquareAttacked(row, 5, !isWhite) &&
        !this.isSquareAttacked(row, 6, !isWhite)
      ) {
        moves.push({ r: row, c: 6, castle: "short" });
      }
    }
    // Long Castle
    if (
      rights.q &&
      this.board[row][3] === "" &&
      this.board[row][2] === "" &&
      this.board[row][1] === ""
    ) {
      if (
        !this.isSquareAttacked(row, 3, !isWhite) &&
        !this.isSquareAttacked(row, 2, !isWhite)
      ) {
        moves.push({ r: row, c: 2, castle: "long" });
      }
    }
    return moves;
  }

  getSlidingMoves(r, c, dirs, isWhite) {
    let moves = [];
    for (let d of dirs) {
      for (let i = 1; i < 8; i++) {
        const tr = r + d[0] * i,
          tc = c + d[1] * i;
        if (!this.isValidPos(tr, tc)) break;
        const target = this.board[tr][tc];
        if (target === "") {
          moves.push({ r: tr, c: tc });
        } else {
          if (Piece.isWhite(target) !== isWhite) moves.push({ r: tr, c: tc });
          break;
        }
      }
    }
    return moves;
  }

  getSteppingMoves(r, c, dirs, isWhite) {
    let moves = [];
    for (let d of dirs) {
      const tr = r + d[0],
        tc = c + d[1];
      if (this.isValidPos(tr, tc)) {
        const target = this.board[tr][tc];
        if (target === "" || Piece.isWhite(target) !== isWhite) {
          moves.push({ r: tr, c: tc });
        }
      }
    }
    return moves;
  }

  // --- SAFETY CHECKS ---
  isValidPos(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  isCheckAfterMove(fromR, fromC, move, isWhite) {
    const tempBoard = this.board.map((row) => [...row]);

    // Perform move on temp board
    tempBoard[move.r][move.c] = tempBoard[fromR][fromC];
    tempBoard[fromR][fromC] = "";

    // Handle En Passant remove
    if (move.enPassant) {
      const dir = isWhite ? -1 : 1;
      tempBoard[move.r - dir][move.c] = "";
    }

    return this.isKingInCheck(tempBoard, isWhite);
  }

  isKingInCheck(board, isWhite) {
    // Find King
    let kR, kC;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === (isWhite ? "K" : "k")) {
          kR = r;
          kC = c;
          break;
        }
      }
    }
    if (kR === undefined) return true; // King missing (shouldnt happen)
    return this.isSquareAttacked(kR, kC, !isWhite, board);
  }

  isSquareAttacked(r, c, attackerIsWhite, board = this.board) {
    // 1. Pawn Attacks
    // If attacker is White, they are coming from Row 6->0.
    // So they attack from (r+1, c-1) and (r+1, c+1)
    const pawnRow = attackerIsWhite ? r + 1 : r - 1;

    if (this.isValidPos(pawnRow, c - 1)) {
      const p = board[pawnRow][c - 1];
      if (p && p.toLowerCase() === "p" && Piece.isWhite(p) === attackerIsWhite)
        return true;
    }
    if (this.isValidPos(pawnRow, c + 1)) {
      const p = board[pawnRow][c + 1];
      if (p && p.toLowerCase() === "p" && Piece.isWhite(p) === attackerIsWhite)
        return true;
    }

    // 2. Knight Attacks
    const knights = this.getSteppingMoves(
      r,
      c,
      DIRECTIONS.knight,
      !attackerIsWhite
    );
    for (let m of knights) {
      const p = board[m.r][m.c];
      if (p && p.toLowerCase() === "n" && Piece.isWhite(p) === attackerIsWhite)
        return true;
    }

    // 3. Sliding Attacks (Rook/Queen)
    const ortho = this.getSlidingMoves(
      r,
      c,
      DIRECTIONS.ortho,
      !attackerIsWhite
    );
    for (let m of ortho) {
      const p = board[m.r][m.c];
      if (
        p &&
        (p.toLowerCase() === "r" || p.toLowerCase() === "q") &&
        Piece.isWhite(p) === attackerIsWhite
      )
        return true;
    }

    // 4. Diagonal Attacks (Bishop/Queen)
    const diag = this.getSlidingMoves(r, c, DIRECTIONS.diag, !attackerIsWhite);
    for (let m of diag) {
      const p = board[m.r][m.c];
      if (
        p &&
        (p.toLowerCase() === "b" || p.toLowerCase() === "q") &&
        Piece.isWhite(p) === attackerIsWhite
      )
        return true;
    }

    // 5. King Attacks
    const king = this.getSteppingMoves(
      r,
      c,
      [...DIRECTIONS.ortho, ...DIRECTIONS.diag],
      !attackerIsWhite
    );
    for (let m of king) {
      const p = board[m.r][m.c];
      if (p && p.toLowerCase() === "k" && Piece.isWhite(p) === attackerIsWhite)
        return true;
    }

    return false;
  }
}
