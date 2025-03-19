
export function isInputValid(input: string) {
  let value = Number(input);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].includes(value);
}
