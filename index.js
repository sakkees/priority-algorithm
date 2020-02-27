const math = require('mathjs');

exports.prioritize = (req, res) => {
  console.log(req.body.comparisonMatrix);
  try {
    JSON.parse(JSON.stringify(req.body));
    const matrix = JSONtoMatrix(req.body.comparisonMatrix);
    res.status(200).json(analyticHierarchyProcess(matrix));
  } catch (error) {
    console.log(error);
    res.status(200).send("No matrix in request");
  }
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
  return matrix.map((col, i) => matrix.map(row => row[i]));
}

/* Comparison matrix from JSON, returns a calculable comparison matrix */ 
function JSONtoMatrix(JSONComparisonMatrix) {
  let matrix = math.matrix();
  let diagonal = 0;

  for(let i = 0; i < JSONComparisonMatrix.length; i++){
    matrix.subset(math.index(i,diagonal), 0);
    diagonal++;
    // console.log("Object in matrix: " + JSONComparisonMatrix[i]);
    // console.log("Name: " + JSONComparisonMatrix[i].name);
    // console.log("Values (array): " + JSONComparisonMatrix[i].values);
    let values = JSONComparisonMatrix[i].values;
    for(let j = 0; j < values.length; j++){
      matrix.subset(math.index(i,j + diagonal), values[j].value);
      // console.log("object in values(array): " + JSONComparisonMatrix[i].values[j]);
      // console.log("object name: " + JSONComparisonMatrix[i].values[j].name);
      // console.log("object value: " + JSONComparisonMatrix[i].values[j].value);
    }
  }

  // Adds missing array for last issue which is not present in the JSON but can be calculated with other data in JSON
  matrix.subset(math.index(matrix.size()[0], 0), 0);

  // Creates an identity matrix ('1' in diagonal of matrix) and adds it in matrix
  let identityMatrix = math.identity(matrix.size()[0]);
  matrix = math.add(matrix , identityMatrix);
  console.log("Matrix after add with identity matrix " + matrix);    

    /* Puts the inverse value in the inverse index in the matrix. Example: value at index [2][1] is 3, 
    the inverse, 1/3 gets put at index [1][2] in the matrix. */ 
    for(let x = 0; x < matrix.size()[0]; x++){
      for(let y = 0; y < matrix.size()[0]; y++){  
          if(matrix._data[x][y] != 0 && matrix._data[y][x] == 0){
              if(matrix._data[x][y] < 1){
                matrix._data[y][x] = Math.round((Math.pow(matrix._data[x][y], -1) + Number.EPSILON) * 100) / 100;
              }else{
                matrix._data[y][x] = Math.pow(matrix._data[x][y], -1);
              }
          } 
      }
    }
  console.log("matrix after pow " + matrix);
  // Currently only returns the matrix, no other properties such as size is returned
  return matrix.valueOf();
}

/*  Analytic Hierarchy Process algorithm, returns the consistency ratio, consistency index, eigenvalues and lambda max for a matrix */
function analyticHierarchyProcess(comparisonMatrix) {
    let numIssues = comparisonMatrix.length;

    const colsComparisonMatrix = transpose(comparisonMatrix);
    /* 
        Sums up each value in array
        Example reducer: const array1 = [1, 2, 3, 4]; const reducer = (accumulator, currentValue) => accumulator + currentValue; 
    */
    let reducer = (accumulator, currentValue) => accumulator + currentValue;
    const sumColsInComparisonMatrix = [];
    /*  Sums up the column values in the comparison matrix */
    for (let i = 0; i < colsComparisonMatrix.length; i++) {
        sumColsInComparisonMatrix[i] = colsComparisonMatrix[i].reduce(reducer);
    }

    console.log("Transposed matrix: " + JSON.stringify(colsComparisonMatrix));
    console.log("sum cols: " + JSON.stringify(sumColsInComparisonMatrix));

    /*  Divides each value in comparison matrix with its columns sum */
    const sumRowsInMatrix = [];
    for (let i = 0; i < comparisonMatrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < comparisonMatrix.length; j++) {
            sum += (comparisonMatrix[i][j] / sumColsInComparisonMatrix[j]);
        }
        sumRowsInMatrix[i] = sum;
    }
    console.log("sum rows after division: " + JSON.stringify(sumRowsInMatrix));

    /* Priority vector is the estimation of eigenvalues of the matrix */
    let priorityVector = [];
    for (let i = 0; i < comparisonMatrix.length; i++) {
        priorityVector[i] = (sumRowsInMatrix[i] / numIssues);
    }
    console.log("Priority vector: " + JSON.stringify(priorityVector));

    /* 
        Matrix multiplication of matrix and priority vector 
        Each value in the result of the multiplication is divided by the value in priorityVector of the same index
    */
    let resultMatrixMultiplication = [];
    let lambdaMaxVector = [];
    
    for (let i = 0; i < comparisonMatrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < comparisonMatrix.length; j++) {
            sum += (comparisonMatrix[i][j] * priorityVector[j]);
        }
        resultMatrixMultiplication[i] = sum;
        lambdaMaxVector[i] = resultMatrixMultiplication[i] / priorityVector[i];
    }

    //console.log("Result of matrix multiplication: " + JSON.stringify(resultMatrixMultiplication));
    const lambdaMax = lambdaMaxVector.reduce(reducer) / numIssues;
    //console.log("Lambda max: " + lambdaMax);
    const consistencyIndex = (lambdaMax - numIssues) / (numIssues - 1);
    //console.log("Consistency Index: " + consistencyIndex);
    const consistencyRatio = consistencyIndex / randomIndexTable(numIssues);
    //console.log("Consistency Ratio: " + consistencyRatio);
    return {
        "Eigenvalues" : priorityVector,
        "LambdaMax" : lambdaMax,
        "ConsistencyIndex" : consistencyIndex,
        "ConsistencyRatio" : consistencyRatio 
    };
}

exports.randomIndexTable = randomIndexTable;
exports.transpose = transpose;
exports.analyticHierarchyProcess = analyticHierarchyProcess;
exports.JSONtoMatrix = JSONtoMatrix;