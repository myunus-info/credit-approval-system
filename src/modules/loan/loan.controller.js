const path = require('path');
const Loan = require('./loan.model');
const Customer = require(path.join(process.cwd(), 'src/modules/customer/customer.model'));
const { asyncHandler, AppError } = require(path.join(process.cwd(), '/src/modules/core/errors'));

exports.createLoan = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_id, interest_rate, tenure } = req.body;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return next(new AppError(404, 'No customer found!'));
  }

  res.status(201).json({ msg: 'success' });
});
