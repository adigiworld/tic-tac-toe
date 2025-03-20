
export function isHorizontalWin(moves: Array<Array<string>>, symbol: string) {
  return moves.some(row => row.every(move => move === symbol));
}
export function isVerticalWin(moves: Array<Array<string>>, symbol: string) {
  return [0, 1, 2].some(col => moves.every(row => row[col] === symbol));
}
export function isDiagonalWin(moves: Array<Array<string>>, symbol: string) {
  return (moves[0][0] === symbol && moves[1][1] === symbol && moves[2][2] === symbol)
    || (moves[0][2] === symbol && moves[1][1] === symbol && moves[2][0] === symbol);
}
export function isCornersWin(moves: Array<Array<string>>, symbol: string) {
  return (moves[0][0] === symbol && moves[0][2] === symbol && moves[2][0] === symbol && moves[2][2] === symbol);
}
export function isCatsGame(moves: Array<Array<string>>) {
  return moves.every((row, r) => row.every((_, c) => moves[r][c] !== "*"));
}
