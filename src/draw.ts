
export function drawGrid(moves: Array<Array<string>>) {
  //console.warn(" 1   2   3");
  drawVLine(moves[0]);
  drarwHLine();
  drawVLine(moves[1]);
  drarwHLine();
  drawVLine(moves[2]);
  //console.warn(" 7   8   9");
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
