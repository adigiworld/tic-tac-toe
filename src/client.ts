#!/usr/bin/env node;
import readline from "node:readline/promises";
import socketIoClient from "socket.io-client";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let serverUrl = process.env.NODE_ENV === "dev" ? "http://127.0.0.1:8080" : "";
const socket = socketIoClient(serverUrl);
let allMoves: Array<Array<string>>;
const moves = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]

socket.on("welcome", message => {
  console.log(message);
});
socket.on("info", info => {
  console.log(info);
});
socket.on("playersMoves", moves => {
  allMoves = moves;
  drawGrid(moves);
});
socket.on("your turn", async () => {
  let valid = false;
  let res;
  while (!valid) {
    res = await rl.question("It's your turn now! Please enter your next move: ");
    valid = isInputValid(res);
    if (!valid) {
      console.error("Please enter a position between 1-9 ");
    }
    let [x, y] = moves[(Number(res) - 1)];
    if (allMoves[x][y] !== "*") {
      console.error(`Position ${res} is already taken! Please select another position.`);
      valid = false;
      continue;
    }
  }
  socket.emit("new move", res);
});
socket.on("other player turn", () => {
  console.log("Wariting for other player's input...");
});
socket.on("won", info => {
  console.log(`The game is over. ${info}`);
  rl.close();
  socket.disconnect();
});
socket.on("loss", info => {
  console.log(`The game is over. ${info}`);
  rl.close();
  socket.disconnect();
});
socket.on("tie", info => {
  console.log(`The game is over. ${info}`);
  rl.close();
  socket.disconnect();
});
/** Game Logic */
export function drawGrid(moves: Array<Array<string>>) {
  console.log();
  drawVLine(moves[0]);
  drarwHLine();
  drawVLine(moves[1]);
  drarwHLine();
  drawVLine(moves[2]);
  console.log();
}
function drawVLine(moves: string[]) {
  let first = moves[0] !== "*" ? moves[0] : " ";
  let second = moves[1] !== "*" ? moves[1] : " ";
  let third = moves[2] !== "*" ? moves[2] : " ";
  console.info(` ${first} | ${second} | ${third} `);
}
function drarwHLine() {
  console.info(`———+———+———`);
}
function isInputValid(input: string) {
  let value = Number(input);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(value);
}
/** Game Logic End */


