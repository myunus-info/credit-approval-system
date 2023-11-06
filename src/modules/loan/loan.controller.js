const path = require('path');
const Loan = require('./loan.model');
const { asyncHandler, AppError } = require(path.join(process.cwd(), '/src/modules/core/errors'));

exports.createLoan = asyncHandler(async (req, res, next) => {
  res.status(201).json({ msg: 'success' });
});
