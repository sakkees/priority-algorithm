const matrix = [
  [1, 5, 9, 0.3333],
  [0.2, 1, 0.2, 0.142857],
  [0.1111, 5, 1, 0.1111],
  [3, 7, 9, 1]
];
const transposedMatrix = [
  [1, 0.2, 0.1111, 3],
  [5, 1, 5, 7],
  [9, 0.2, 1, 9],
  [0.3333, 0.142857, 0.1111, 1]
];
const JSONmatrix = {
  A: { values: [1, 5, 9, 0.3333] },
  B: { values: [0.2, 1, 0.2, 0.142857] },
  C: { values: [0.1111, 5, 1, 0.1111] },
  D: { values: [3, 7, 9, 1] }
};

const { randomIndexTable } = require("./index");
test("Random index table with order 3", () => {
  expect(randomIndexTable(3)).toBe(0.58);
});

test("Random index table with order -1", () => {
  expect(randomIndexTable(-1)).toBe(0);
});

test("Random index table with order 20", () => {
  expect(randomIndexTable(20)).toBe(0);
});

const { calculateConsistencyRatio } = require("./index");
test("Example matrix with scale, CR = 0.2886 ", () => {
  expect(calculateConsistencyRatio(JSONmatrix)).toBeCloseTo(0.2886, 4);
});

const { transpose } = require("./index");
test("Transposed matrix, columns should be rows", () => {
  expect(JSON.stringify(transpose(matrix))).toBe(JSON.stringify(transposedMatrix));
});

test("Matrix should not be same as itself after transpose", () => {
  expect(JSON.stringify(transpose(matrix))).not.toBe(JSON.stringify(matrix));
});