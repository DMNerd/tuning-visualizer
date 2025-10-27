export const makeDisplayX =
  (lefty: boolean, width: number) =>
  (x: number): number =>
    lefty ? width - x : x;
