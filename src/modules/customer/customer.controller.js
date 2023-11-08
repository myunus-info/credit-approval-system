const path = require('path');
const Customer = require('./customer.model');
const { asyncHandler, AppError } = require(path.join(process.cwd(), 'src/modules/core/errors'));
const { getLoanDataFromXLfile } = require(path.join(process.cwd(), 'src/modules/loan/loan.helpers'));
const {
  calculateCreditScore,
  calculateMonthlyInstallment,
  calculateTotalCurrentLoanEMIs,
  getCustomerDataFromXLfile,
  determineLoanEligibility,
} = require('./customer.helpers');

exports.registerCustomer = asyncHandler(async (req, res, next) => {
  const { customer_id, first_name, last_name, age, monthly_income, phone_number } = req.body;

  const existingCustomer = await Customer.findByPk(customer_id);
  if (existingCustomer) {
    return next(new AppError(400, `Customer with Id: (${customer_id}) already exists!`));
  }

  const approved_limit = Math.round((36 * monthly_income) / 100000) * 100000;

  let newCustomer;
  try {
    newCustomer = await Customer.create({
      customer_id,
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
    customer_id: newCustomer.customer_id,
    name: `${newCustomer.first_name} ${newCustomer.last_name}`,
    age: newCustomer.age,
    monthly_income: newCustomer.monthly_income,
    approved_limit,
    phone_number: newCustomer.phone_number,
  });
});

exports.checkLoanEligibility = asyncHandler(async (req, res, next) => {
  try {
    const { customer_id, loan_amount, interest_rate, tenure } = req.body;
    const customers = getCustomerDataFromXLfile();
    const loans = getLoanDataFromXLfile();

    const customer = customers.find(c => c.customer_id === customer_id);
    if (!customer) {
      return next(new AppError(404, 'No customer found!'));
    }

    const customerLoans = loans.filter(loan => loan.customer_id === customer.customer_id);
    if (!customerLoans || customerLoans.length < 1) {
      return next(new AppError(500, 'No loans found for this customer!'));
    }

    const totalCurrentLoanEMI = calculateTotalCurrentLoanEMIs(customerLoans);

    const creditScore = calculateCreditScore(customer, customerLoans);
    console.log('Credit Score: ', creditScore);
    const { interestRate, approval } = determineLoanEligibility(
      creditScore,
      interest_rate,
      customer,
      totalCurrentLoanEMI
    );
    const monthlyInstallment = calculateMonthlyInstallment(loan_amount, interest_rate, tenure);

    if (approval) {
      res.status(200).json({
        customer_id: customer.customer_id,
        approval,
        interest_rate: interestRate,
        corrected_interest_rate: interestRate,
        tenure,
        monthly_installment: monthlyInstallment,
      });
    } else {
      res.status(401).json({
        customer_id: customer.customer_id,
        approval: false,
        interest_rate: 0,
        corrected_interest_rate: 0,
        tenure: 0,
        monthly_installment: 0,
      });
    }
  } catch (err) {
    return next(new AppError(500, 'Internal server error!'));
  }
});
