class Multiplayer {
  constructor(onMoveCallback) {
    this.socket = null;
    this.onMove = onMoveCallback;
    this.room = null;
    this.color = null; // 'w' or 'b'
  }

  connect() {
    // Requires a running WebSocket server (e.g., Node.js + ws)
    this.socket = new WebSocket("ws://localhost:8080");

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "move") {
        this.onMove(data.move);
      } else if (data.type === "init") {
        this.color = data.color;
        alert(`You are playing as ${this.color === "w" ? "White" : "Black"}`);
      }
    };
  }

  sendMove(move) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({ type: "move", room: this.room, move: move })
      );
    }
  }

  joinRoom(roomCode) {
    this.room = roomCode;
    if (!this.socket) this.connect();
    // Wait for connection open in real app
    setTimeout(() => {
      this.socket.send(JSON.stringify({ type: "join", room: roomCode }));
    }, 500);
  }

  isMyTurn(currentTurn) {
    if (!this.color) return true; // Local play
    return this.color === currentTurn;
  }
}
