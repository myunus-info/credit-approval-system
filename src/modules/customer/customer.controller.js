const path = require('path');
const Customer = require('./customer.model');
const { asyncHandler, AppError } = require(path.join(process.cwd(), 'src/modules/core/errors'));
const {
  calculateCreditScore,
  determineLoanEligibility,
  calculateMonthlyInstallment,
} = require('./customer.helpers');

exports.registerCustomer = asyncHandler(async (req, res, next) => {
  const { first_name, last_name, age, monthly_income, phone_number } = req.body;

  const approved_limit = Math.round((36 * monthly_income) / 100000) * 100000;

  let newCustomer;
  try {
    newCustomer = await Customer.create({
      first_name,
      last_name,
      age,
      monthly_income,
      phone_number,
    });
  } catch (err) {
    return next(new AppError(500, 'Internal server error!'));
  }

  res.status(201).json({
    customer_id: newCustomer.id,
    name: `${newCustomer.first_name} ${newCustomer.last_name}`,
    age: newCustomer.age,
    monthly_income: newCustomer.monthly_income,
    approved_limit,
    phone_number: newCustomer.phone_number,
  });
});

exports.checkLoanEligibility = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_amount, interest_rate, tenure } = req.body;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return next(new AppError(404, 'No customer found!'));
  }

  const creditScore = calculateCreditScore(customer, loan_amount, tenure);
});
