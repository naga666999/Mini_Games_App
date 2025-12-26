class ChessAI {
  constructor(rules) {
    this.rules = rules;
    this.pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  }

  getBestMove(board, depth, isWhite) {
    // 1. Create a DEEP COPY of the board to prevent game corruption
    const tempBoard = JSON.parse(JSON.stringify(board));

    // 2. Create a temporary Rules instance bound to this temp board
    // This ensures the AI's "thinking" doesn't affect the real game UI
    const tempRules = new ChessRules(tempBoard);

    let bestMove = null;
    let bestValue = isWhite ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    // Get all legal moves using safe defaults
    const moves = this.getAllMoves(tempBoard, tempRules, isWhite);

    // Sort captures first for speed
    moves.sort((a, b) => {
      const pA = tempBoard[a.toR][a.toC] ? 10 : 0;
      const pB = tempBoard[b.toR][b.toC] ? 10 : 0;
      return pB - pA;
    });

    for (let move of moves) {
      this.makeMove(tempBoard, move);
      const value = this.minimax(
        tempBoard,
        tempRules,
        depth - 1,
        alpha,
        beta,
        !isWhite
      );
      this.undoMove(tempBoard, move);

      if (isWhite) {
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestValue);
      } else {
        if (value < bestValue) {
          bestValue = value;
          bestMove = move;
        }
        beta = Math.min(beta, bestValue);
      }
      if (beta <= alpha) break;
    }

    return bestMove;
  }

  minimax(board, rules, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return this.evaluateBoard(board);

    const moves = this.getAllMoves(board, rules, isMaximizing);

    if (moves.length === 0) {
      if (rules.isKingInCheck(board, isMaximizing))
        return isMaximizing ? -Infinity : Infinity;
      return 0; // Stalemate
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let move of moves) {
        this.makeMove(board, move);
        const evalVal = this.minimax(
          board,
          rules,
          depth - 1,
          alpha,
          beta,
          false
        );
        this.undoMove(board, move);
        maxEval = Math.max(maxEval, evalVal);
        alpha = Math.max(alpha, evalVal);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let move of moves) {
        this.makeMove(board, move);
        const evalVal = this.minimax(
          board,
          rules,
          depth - 1,
          alpha,
          beta,
          true
        );
        this.undoMove(board, move);
        minEval = Math.min(minEval, evalVal);
        beta = Math.min(beta, evalVal);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  getAllMoves(board, rules, isWhite) {
    let moves = [];
    // Use dummy state for search (assumes no En Passant/Castling during deep thought to save speed)
    // This is a standard optimization for basic JS engines
    const dummyLast = null;
    const dummyRights = { w: { k: true, q: true }, b: { k: true, q: true } };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && Piece.isWhite(p) === isWhite) {
          // checkSafety = true ensures AI never makes illegal moves
          const legal = rules.getLegalMoves(r, c, dummyLast, dummyRights, true);
          legal.forEach((m) => {
            moves.push({
              fromR: r,
              fromC: c,
              toR: m.r,
              toC: m.c,
              savedPiece: board[m.r][m.c],
            });
          });
        }
      }
    }
    return moves;
  }

  makeMove(board, move) {
    board[move.toR][move.toC] = board[move.fromR][move.fromC];
    board[move.fromR][move.fromC] = "";

    // Auto-Promote
    const p = board[move.toR][move.toC];
    if (p.toLowerCase() === "p" && (move.toR === 0 || move.toR === 7)) {
      board[move.toR][move.toC] = p === "P" ? "Q" : "q";
      move.promotion = true;
    }
  }

  undoMove(board, move) {
    if (move.promotion) {
      const isWhite = move.toR === 0;
      board[move.fromR][move.fromC] = isWhite ? "P" : "p";
    } else {
      board[move.fromR][move.fromC] = board[move.toR][move.toC];
    }
    board[move.toR][move.toC] = move.savedPiece || "";
  }

  evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const val = this.pieceValues[p.toLowerCase()];
        score += Piece.isWhite(p) ? val : -val;
      }
    }
    return score;
  }
}
