// Server-Side Code (Node.js)
const express = require("express");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function(uniqueSocket) {
    console.log("connected!");

    // Check for player roles
    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    } else {
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", result);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move:", move);
                uniqueSocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.error("Move error:", err);
            uniqueSocket.emit("invalidMove", move);
        }
    });

    uniqueSocket.on("disconnect", function() {
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });
});

server.listen(3000, function() {
    console.log("Listening on port 3000");
});