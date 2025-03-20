import http from "node:http";
import express from "express";
import { type DefaultEventsMap, Server, Socket } from "socket.io";
import { readFile } from "node:fs/promises";
import { isInputValid } from "./validate.ts";
import { isCatsGame, isCornersWin, isDiagonalWin, isHorizontalWin, isVerticalWin } from "./wins.ts";

const app = express();
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
const io = new Server(server);
/** Game Logic Start */
let isGameOver = false;
let player = (Math.random() > 0.5) ? "Player X" : "Player O";
let playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
const moves = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]

const RUNNING = "RUNNING";
const PLAYER_X_WINS = "PLAYER_X_WINS";
const PLAYER_O_WINS = "PLAYER_O_WINS";
const CATS_GAME = "CATS_GAME";

let gameState = RUNNING;
/** Game Logic End */

let playerX: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined;
let playerO: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined;
io.on("connection", (socket) => {
  console.info(`A new player has joined!`);
  socket.emit("welcome", "Welcome to Tic-Tac-Toe");
  if (playerX) {
    console.log("A second player has joined! Starning game...");
    playerO = socket;
    playerX.emit("info", "A second player has joined! Time to start the game!");
    playerO.emit("info", "You are the second player(O), the game will now start!");
    /** Start Game */
    startGame();
  } else {
    console.log("The first player has joined! Waiting for second player...");
    playerX = socket;
    socket.emit("info", "You are the first player(X), we are waitind for second player to join...");
  }
  socket.on("new move", input => {
    if (isInputValid(input)) {
      let [x, y] = moves[(Number(input) - 1)];
      playersMoves[x][y] = player === "Player X" ? "X" : "O";
      //console.warn(playersMoves);
      gameState = getGamesState(playersMoves);
      isGameOver = [PLAYER_X_WINS, PLAYER_O_WINS, CATS_GAME].includes(gameState);
      playerX?.emit("playersMoves", playersMoves);
      playerO?.emit("playersMoves", playersMoves);
      player = player === "Player X" ? "Player O" : "Player X";

      if (!isGameOver) {
        if (player === "Player X") {
          playerX?.emit("your turn");
          playerO?.emit("other player turn");
        } else {
          playerO?.emit("your turn");
          playerX?.emit("other player turn");
        }
      } else {
        if (gameState === PLAYER_X_WINS) {
          playerX?.emit("won", "You Won!!!");
          playerO?.emit("loss", "You Lost!");
          playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          playerX = undefined;
          playerO = undefined;
        } else if (gameState === PLAYER_O_WINS) {
          playerO?.emit("won", "You Won!!!");
          playerX?.emit("loss", "You Lost!");
          playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          playerX = undefined;
          playerO = undefined;
        } else {
          socket.emit("tie", "Cat's Game. It's a Tie.");
          playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          playerX = undefined;
          playerO = undefined;
        }
      }
    } else {
      console.error("Input is not valid.");
    }
  });
});

function startGame() {
  console.warn("The game has started!");
  playerX?.emit("playersMoves", playersMoves);
  playerO?.emit("playersMoves", playersMoves);
  player = (Math.random() > 0.5) ? "Player X" : "Player O";

  if (player === "Player X") {
    playerX?.emit("your turn");
    playerO?.emit("other player turn");
  } else {
    playerO?.emit("your turn");
    playerX?.emit("other player turn");
  }

}
function getGamesState(moves: Array<Array<string>>) {
  let playerXwins = isHorizontalWin(moves, "X")
    || isVerticalWin(moves, "X")
    || isDiagonalWin(moves, "X")
    || isCornersWin(moves, "X");
  if (playerXwins) { return PLAYER_X_WINS; }

  let playerOwins = isHorizontalWin(moves, "O")
    || isVerticalWin(moves, "O")
    || isDiagonalWin(moves, "O")
    || isCornersWin(moves, "O");
  if (playerOwins) { return PLAYER_O_WINS; }

  let catsGame = isCatsGame(moves);
  if (catsGame && !playerXwins && !playerOwins) {
    return CATS_GAME;
  }

  return RUNNING;
}

app.get("/game", async (_req, res) => {
  const code = await readFile(new URL("../outSrc/client.js", import.meta.url), "utf8");
  const header = new Headers({ "content-Type": "text/javascript" });
  res.setHeaders(header);
  res.send(code);
});

server.listen(PORT, () => { console.log(`Server is listning at port: ${PORT}`) });
