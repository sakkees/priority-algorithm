// const escapeHtml = require('escape-html');
const math = require('mathjs');

exports.prioritize = (req, res) => {
    console.log(req.body.comparisonMatrix);
    // console.log("Stringify comparison matrix: " + JSON.stringify(req.body.comparisonMatrix));
    // res.send("OLD jsonformat: " + JSON.stringify(JSONtoMatrixOLD(req.body.comparisonMatrix)));
    res.send(JSON.stringify(JSONtoMatrix(req.body.comparisonMatrix)));
    /*
    if (req.body.comparisonMatrix == null) {
      res.send("Matrix is empty");
    } else {
      // should send JSON file with CR and eigenvalues etc.
      res.send(
        "Consistency ratio: " +
          calculateConsistencyRatio(req.body.comparisonMatrix) +
          "." +
          " A CR of 0.1 or less is considered acceptable. In practice, however, consistency ratios exceeding 0.10 occur frequently."
      );
    }*/
};
/*
    Table for calculating the consistency ratio.
    For matrix of order 4 the index in the array of randomIndexTable is 3 and the Random Index is 0.90 
    “A cost-value approach to prioritizing requirements” has a table showing the RI values up to matrix of order 15)
*/
function randomIndexTable(order) {
    if (order > 15 || order <= 0) {
        return 0;
    }
    const randomIndexTable = [0.00, 0.00, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];
    return randomIndexTable[order - 1];
}

/*  Transposes the matrix, columns become rows */
function transpose(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

/* Comparison matrix from JSON, returns a calculable comparison matrix */ 
function JSONtoMatrix(JSONComparisonMatrix) {
  let matrix = math.matrix();
  
  for(let i = 0; i < JSONComparisonMatrix.length; i++){
    // console.log("Object in matrix: " + JSONComparisonMatrix[i]);
    // console.log("Name: " + JSONComparisonMatrix[i].name);
    // console.log("Values (array): " + JSONComparisonMatrix[i].values);
    let values = JSONComparisonMatrix[i].values;
    for(let j = 0; j < values.length; j++){
      matrix.subset(math.index(i,j), JSONComparisonMatrix[i].values[j].value) ;
      // console.log("object in values(array): " + JSONComparisonMatrix[i].values[j]);
      // console.log("object name: " + JSONComparisonMatrix[i].values[j].name);
      // console.log("object value: " + JSONComparisonMatrix[i].values[j].value);
    }
  }
  console.log(matrix);

  /* Puts the inverse value in the inverse index in the matrix. Example: value at index [2][1] is 3, 
    the inverse, 1/3 gets put at index [1][2] in the matrix.
    Also puts value 1 in the diagonal in the matrix */ 
    for(const x = 0; x < matrix.length; x++){
      // matrix[x][x] = 1;
      for(const y = 0; y < matrix.length; y++){  
          if(matrix[x][y] != 0 ){
          // matrix[y][x] = Math.pow(matrix[x][y], -1);  
          } 
      }
  }

  // Currently only returns the matrix, no other properties such as size is returned
  return matrix._data;
}

/*  Analytic Hierarchy Process algorithm, returns the consistency ratio*/
function calculateConsistencyRatio(comparisonMatrix) {
    const matrix = [];
    let numIssues = 0;

    /* Comparison matrix from parameter */
    for (const issue in comparisonMatrix) {
        let rows = [];
        console.log(issue);
        for (const value in comparisonMatrix[issue]) {
            rows = comparisonMatrix[issue][value];
            console.log(JSON.stringify(rows));
        }
        matrix[numIssues] = rows;
        numIssues++;
    }

    const colsComparisonMatrix = transpose(matrix);
    /* 
        Sums up each value in array
        Example reducer: const array1 = [1, 2, 3, 4]; const reducer = (accumulator, currentValue) => accumulator + currentValue; 
    */
    let reducer = (accumulator, currentValue) => accumulator + currentValue;
    const sumColsInComparisonMatrix = [];
    /*  Sums up the column values in the comparison matrix */
    for (const i = 0; i < colsComparisonMatrix.length; i++) {
        sumColsInComparisonMatrix[i] = colsComparisonMatrix[i].reduce(reducer);
    }

    console.log("matrix: " + JSON.stringify(matrix));
    console.log("Transposed matrix: " + JSON.stringify(colsComparisonMatrix));
    console.log("sum cols: " + JSON.stringify(sumColsInComparisonMatrix));

    const sumRowsInMatrix = [];
    /*  Divides each value in comparison matrix with its columns sum */
    for (const i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (const j = 0; j < matrix.length; j++) {
            sum += (matrix[i][j] / sumColsInComparisonMatrix[j]);
        }
        sumRowsInMatrix[i] = sum;
    }
    console.log("sum rows after division: " + JSON.stringify(sumRowsInMatrix));

    /* Priority vector is the estimation of eigenvalues of the matrix */
    let priorityVector = [];
    for (const i = 0; i < matrix.length; i++) {
        priorityVector[i] = (sumRowsInMatrix[i] / numIssues);
    }
    console.log("Priority vector: " + JSON.stringify(priorityVector));

    /* 
        Matrix multiplication of matrix and priority vector 
        Each value in the result of the multiplication is divided by the value in priorityVector of the same index
    */
    let resultMatrixMultiplication = [];
    let lambdaMaxVector = [];
    
    for (const i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (const j = 0; j < matrix.length; j++) {
            sum += (matrix[i][j] * priorityVector[j]);
        }
        resultMatrixMultiplication[i] = sum;
        lambdaMaxVector[i] = resultMatrixMultiplication[i] / priorityVector[i];
    }

    console.log("Result of matrix multiplication: " + JSON.stringify(resultMatrixMultiplication));
    const lambdaMax = lambdaMaxVector.reduce(reducer) / numIssues;
    console.log("Lambda max: " + lambdaMax);
    const consistencyIndex = (lambdaMax - numIssues) / (numIssues - 1);
    console.log("Consistency Index: " + consistencyIndex);
    const consistencyRatio = consistencyIndex / randomIndexTable(numIssues);
    console.log("Consistency Ratio: " + consistencyRatio);
    return consistencyRatio;
}

exports.randomIndexTable = randomIndexTable;
exports.transpose = transpose;
exports.calculateConsistencyRatio = calculateConsistencyRatio;
exports.JSONtoMatrix = JSONtoMatrix;