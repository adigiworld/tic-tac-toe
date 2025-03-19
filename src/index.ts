import readline from "readline/promises";
import { isInputValid } from "./validate.ts";
import { drawGrid } from "./draw.ts";
import { isCornersWin, isDiagonalWin, isHorizontalWin, isVerticalWin } from "./wins.ts";

let ground = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let isGameOver = false;
let player = (Math.random() > 0.5) ? "Player X" : "Player O";
let playersMoves = new Array(3).fill(undefined).map(arr => new Array(3).fill("*"));
const moves = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]

const RUNNING = "RUNNING";
const PLAYER_X_WINS = "PLAYER_X_WINS";
const PLAYER_O_WINS = "PLAYER_O_WINS";
const CATS_GAME = "CATS_GAME";

async function start() {
  console.log("Welcome to Tic Tac Toe Game!");
  try {
    let gameState = RUNNING;
    while (!isGameOver) {
      console.log();
      drawGrid(playersMoves);
      console.log();
      let res = await ground.question(`${player}, please enter your next move: `);
      if (isInputValid(res)) {
        let [x, y] = moves[(Number(res) - 1)];
        //console.warn(x, y);
        //console.log(`${player}, selected the position ${res}`);
        if (playersMoves[x][y] !== "*") {
          console.error(`Position ${res} is already taken! Please select another position.`);
          continue;
        }
        playersMoves[x][y] = player === "Player X" ? "X" : "O";
        //console.warn(playersMoves);
        player = player === "Player X" ? "Player O" : "Player X";
        gameState = getGamesState(playersMoves);
        isGameOver = [PLAYER_X_WINS, PLAYER_O_WINS, CATS_GAME].includes(gameState);
      } else {
        console.error("Please enter a position between 1-9 ");
      }
    }
    console.log();
    drawGrid(playersMoves);
    console.log();
    if (gameState === PLAYER_X_WINS) {
      console.warn("Player X is the winner!");
    }
    if (gameState === PLAYER_O_WINS) {
      console.warn("Player O is the winner!");
    }
    if (gameState === CATS_GAME) {
      console.warn("It's a Tie!");
    }
    ground.close();

  } catch (err) {
    console.error(err);
  }
}

function getGamesState(moves: Array<Array<string>>) {
  let playerXwins = isHorizontalWin(moves, "X")
    || isVerticalWin(moves, "X")
    || isDiagonalWin(moves, "X")
    || isCornersWin(moves, "X");
  let playerOwins = isHorizontalWin(moves, "O")
    || isVerticalWin(moves, "O")
    || isDiagonalWin(moves, "O")
    || isCornersWin(moves, "O");
  if (playerXwins) { return PLAYER_X_WINS; }
  if (playerOwins) { return PLAYER_O_WINS; }

  return RUNNING;
}

start();

