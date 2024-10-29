// Client-Side Code (JavaScript)
const socket = io(); // Initiates connection to the server.

const chess = new Chess(); // Initializes a new Chess game.
const boardElement = document.querySelector(".chessboard"); // Use lowercase "chessboard"

let draggedPiece = null; // Currently dragged piece.
let sourceSquare = null; // Original square of the dragged piece.
let playerRole = null; // Role of the player, 'w' or 'b'.


const renderBoard = () => {
  const board = chess.board(); // Retrieves the current state of the board.
  boardElement.innerHTML = ""; // Clears the board display.

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div"); // Creates a square element.
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      // If a piece exists on the square, create and style the piece element.
      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.draggable = playerRole === square.color; // Set draggable if player owns the piece.

        pieceElement.innerHTML = getPieceUnicode(square); // Render the piece symbol.

        // Set up drag events for the piece.
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", ""); // Required for Firefox.
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };

          handleMove(sourceSquare, targetSquare);
        }
      });

      // Append the square to the board here, outside of the drop listener.
      boardElement.appendChild(squareElement);
    });
  });
  
  if(playerRole === "b"){
    boardElement.classList.add("flipped");
  }
  else{
    boardElement.classList.remove("flipped");
  }

};

// Placeholder for handling game modes.
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};

// Retrieves the Unicode character for a piece.
const getPieceUnicode = (square) => {
  const piece = square.type;
  const color = square.color;

  const unicodePieces = {
    p: { w: "♙", b: "♟︎" },
    r: { w: "♖", b: "♜" },
    n: { w: "♘", b: "♞" },
    b: { w: "♗", b: "♝" },
    q: { w: "♕", b: "♛" },
    k: { w: "♔", b: "♚" },
  };

  return unicodePieces[piece][color] || "";
};

// Listen for player assignment and board state updates
socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (fen) {
  chess.move(fen);
  renderBoard();
});

renderBoard(); // Initial rendering of the board.
