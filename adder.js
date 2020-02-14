/*
 * My adder test CF, adds 10 to your number
 *
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
*/
exports.add = (req, res) => {
    var message = parseInt(req.query.message) || parseInt(req.body.message) || 0 ;

    var result = message + 10;

    res.status(200).send(result.toString());
};
