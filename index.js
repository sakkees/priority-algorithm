const escapeHtml = require('escape-html');

exports.prioritize = (req, res) => {
    console.log("Name (query): " + req.query.name);
    console.log("Name (body): " + req.body.name);
    console.log("Query: " + JSON.stringify(req.query));
    console.log("Body: " + JSON.stringify(req.body));

    res.send("Consistency ratio: " + calculateConsistencyRatio(req) + "." + " A CR of 0.1 or less is considered acceptable. In practice, however, consistency ratios exceeding 0.10 occur frequently."); // bonus: send eigenvalues 
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
    var randomIndexTable = [0.00, 0.00, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];
    return randomIndexTable[order - 1];
}
/*  Transposes the matrix, columns become rows */
function transpose(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

/*  AHP algorithm, returns the consistency ratio*/
function calculateConsistencyRatio(req) {
    var comparisonMatrix = req.body.comparisonMatrix;
    var matrix = [];
    var numIssues = 0;

    /* Comparison matrix */
    for (var issue in comparisonMatrix) {
        console.log(issue);
        for (var value in comparisonMatrix[issue]) {
            var rows = comparisonMatrix[issue][value];
            console.log(JSON.stringify(rows));
        }
        matrix[numIssues] = rows;
        numIssues++;
    }
    /* Matrix */
    var colsComparisonMatrix = transpose(matrix);

    /* 
        Sums up each value in array
        Example reducer : const array1 = [1, 2, 3, 4]; const reducer = (accumulator, currentValue) => accumulator + currentValue; 
    */
    var reducer = (accumulator, currentValue) => accumulator + currentValue;
    var sumColsInComparisonMatrix = [];
    /*  Sums up the column values in the comparison matrix */
    for (var i = 0; i < colsComparisonMatrix.length; i++) {
        sumColsInComparisonMatrix[i] = colsComparisonMatrix[i].reduce(reducer);
    }

    console.log("matrix: " + JSON.stringify(matrix));
    console.log("Transposed matrix: " + JSON.stringify(colsComparisonMatrix));
    console.log("sum cols: " + JSON.stringify(sumColsInComparisonMatrix));

    var sumRowsInMatrix = [];
    /*  Divides each value in comparison matrix with its columns sum */
    for (var i = 0; i < matrix.length; i++) {
        var sum = 0;
        for (var j = 0; j < matrix.length; j++) {
            sum += (matrix[i][j] / sumColsInComparisonMatrix[j]);
        }
        sumRowsInMatrix[i] = sum;
    }
    console.log("sum rows after division: " + JSON.stringify(sumRowsInMatrix));

    /* Priority vector is the estimation of eigenvalues of the matrix */
    var priorityVector = [];
    for (var i = 0; i < matrix.length; i++) {
        priorityVector[i] = (sumRowsInMatrix[i] / numIssues);
    }
    console.log("Priority vector: " + JSON.stringify(priorityVector));

    /* 
        Matrix multiplication of matrix and priority vector 
        Each value in the result of the multiplication is divided by the value in priorityVector of the same index
    */
    var resultMatrixMultiplication = [];
    var lambdaMaxVector = [];
    var sum = 0;
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix.length; j++) {
            sum += (matrix[i][j] * priorityVector[j]);
        }
        resultMatrixMultiplication[i] = sum;
        lambdaMaxVector[i] = resultMatrixMultiplication[i] / priorityVector[i];
        sum = 0;
    }

    console.log("Result of matrix multiplication: " + JSON.stringify(resultMatrixMultiplication));
    var lambdaMax = lambdaMaxVector.reduce(reducer) / numIssues;
    console.log("Lambda max: " + lambdaMax);
    var consistencyIndex = (lambdaMax - numIssues) / (numIssues - 1);
    console.log("Consistency Index: " + consistencyIndex);
    var consistencyRatio = consistencyIndex / randomIndexTable(numIssues);
    console.log("Consistency Ratio: " + consistencyRatio);

    return consistencyRatio;
}