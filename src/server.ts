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
//let isGameOver = false;
//let player = (Math.random() > 0.5) ? "Player X" : "Player O";
//let playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
const moves = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]

const RUNNING = "RUNNING";
const PLAYER_X_WINS = "PLAYER_X_WINS";
const PLAYER_O_WINS = "PLAYER_O_WINS";
const CATS_GAME = "CATS_GAME";
const WAITING = "WAITING";

type Game = {
  player: string | undefined,
  isGameOver?: boolean,
  //gameStatus: string ( "WAITING" | "RUNNING"),
  gameState: string,
  playersMoves: Array<Array<string>>,
  playerXSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined;
  playerOSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined;
  playerXId: number;
  playerOId: number;
}
//let gameState = RUNNING;
function createNewGame(): Game {
  return {
    player: undefined,
    isGameOver: false,
    gameState: WAITING,
    playersMoves: new Array(3).fill(undefined).map(_arr => new Array(3).fill("*")),
    playerXSocket: undefined,
    playerOSocket: undefined,
    playerXId: 0,
    playerOId: 0,
  }
}
let games: Game[] = [];
/** Game Logic End */

let nextSocketId = 1;
io.on("connection", (socket) => {
  if (games.length === 0) { nextSocketId = 1; }
  let socketId = nextSocketId;
  nextSocketId += 1;
  socket.emit("welcome", "Welcome to Tic-Tac-Toe");
  console.info(`A new player has joined!`);
  let waitingGame = games.find(game => game.gameState === WAITING);
  let game: Game;
  if (waitingGame) {
    game = waitingGame;
    //let { playerXSocket, playerOSocket } = game;
    console.log("A second player has joined! Starning game...");
    game.playerOSocket = socket;
    game.playerOId = socketId;
    game.playerXSocket?.emit("info", "A second player has joined! Time to start the game!");
    game.playerOSocket?.emit("info", `You are the second player(O), your id is ${socketId}, you are playing against user with id ${game.playerXId}, the game will now start!`);
    /** Start Game */
    startGame(game);
  } else {
    console.log("The first player has joined! Waiting for second player...");
    game = createNewGame();
    game.playerXId = socketId;
    game.playerXSocket = socket;
    game.playerXSocket.emit("info", `You are the first player(X), your id is ${socketId}, we are waitind for second player to join...`);
    games.push(game);
  }
  socket.on("new move", input => {
    if (isInputValid(input)) {
      let [x, y] = moves[(Number(input) - 1)];
      game.playersMoves[x][y] = game.player === "Player X" ? "X" : "O";
      //console.warn(playersMoves);
      game.gameState = getGamesState(game.playersMoves);
      game.isGameOver = [PLAYER_X_WINS, PLAYER_O_WINS, CATS_GAME].includes(game.gameState);
      game.playerXSocket?.emit("playersMoves", game.playersMoves);
      game.playerOSocket?.emit("playersMoves", game.playersMoves);
      game.player = game.player === "Player X" ? "Player O" : "Player X";

      if (!game.isGameOver) {
        if (game.player === "Player X") {
          game.playerXSocket?.emit("your turn");
          game.playerOSocket?.emit("other player turn");
        } else {
          game.playerOSocket?.emit("your turn");
          game.playerXSocket?.emit("other player turn");
        }
      } else {
        if (game.gameState === PLAYER_X_WINS) {
          game.playerXSocket?.emit("won", "You Won!!!");
          game.playerOSocket?.emit("loss", "You Lost!");
          //game.playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          //game.playerXSocket = undefined;
          //game.playerOSocket = undefined;
        } else if (game.gameState === PLAYER_O_WINS) {
          game.playerOSocket?.emit("won", "You Won!!!");
          game.playerXSocket?.emit("loss", "You Lost!");
          //game.playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          //playerX = undefined;
          //playerO = undefined;
        } else if (game.gameState === CATS_GAME) {
          socket.emit("tie", "Cat's Game. It's a Tie.");
          //playersMoves = new Array(3).fill(undefined).map(_arr => new Array(3).fill("*"));
          //playerX = undefined;
          //playerO = undefined;
        }
        games = games.filter(g => g !== game);
      }
    } else {
      console.error("Input is not valid.");
    }
  });
});

function startGame(game: Game) {
  game.gameState = RUNNING;
  console.warn("The game has started!");
  let { playersMoves, playerXSocket, playerOSocket } = game;
  playerXSocket?.emit("playersMoves", playersMoves);
  playerOSocket?.emit("playersMoves", playersMoves);
  game.player = (Math.random() > 0.5) ? "Player X" : "Player O";

  if (game.player === "Player X") {
    playerXSocket?.emit("your turn");
    playerOSocket?.emit("other player turn");
  } else {
    playerOSocket?.emit("your turn");
    playerXSocket?.emit("other player turn");
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
