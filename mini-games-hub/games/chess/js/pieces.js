const PIECES = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

const BOARD_LAYOUT = [
  ["r", "n", "b", "q", "k", "b", "n", "r"], // 0: Black
  ["p", "p", "p", "p", "p", "p", "p", "p"], // 1
  ["", "", "", "", "", "", "", ""], // 2
  ["", "", "", "", "", "", "", ""], // 3
  ["", "", "", "", "", "", "", ""], // 4
  ["", "", "", "", "", "", "", ""], // 5
  ["P", "P", "P", "P", "P", "P", "P", "P"], // 6: White
  ["R", "N", "B", "Q", "K", "B", "N", "R"], // 7
];

// Directions for sliding pieces
const DIRECTIONS = {
  ortho: [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ],
  diag: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
  knight: [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ],
};

class Piece {
  static isWhite(char) {
    return char === char.toUpperCase();
  }
  static isEmpty(char) {
    return char === "";
  }

  static getSymbol(char) {
    if (!char) return "";
    const color = this.isWhite(char) ? "w" : "b";
    return PIECES[color][char.toLowerCase()];
  }
}
