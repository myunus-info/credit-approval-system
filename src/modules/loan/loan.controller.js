const path = require('path');
const Loan = require('./loan.model');
const Customer = require(path.join(process.cwd(), 'src/modules/customer/customer.model'));
const { asyncHandler, AppError } = require(path.join(process.cwd(), '/src/modules/core/errors'));
const {
  calculateCreditScore,
  determineLoanEligibility,
  calculateTotalCurrentLoanEMIs,
  calculateMonthlyInstallment,
  getLoanDataFromXLfile,
} = require('./loan.helpers');

exports.createLoan = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_id, interest_rate, tenure } = req.body;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return next(new AppError(404, 'No customer found!'));
  }

  const loans = getLoanDataFromXLfile();
  const customerLoans = loans.filter(loan => loan.customer_id === customer.customer_id);
  if (!customerLoans || customerLoans.length < 1) {
    return next(new AppError(500, 'No loans found for this customer!'));
  }

  const creditScore = calculateCreditScore(customer, customerLoans);
  const totalCurrentLoanEMI = calculateTotalCurrentLoanEMIs(customerLoans);
  const monthlyInstallment = calculateMonthlyInstallment(customerLoans);

  const { approval } = determineLoanEligibility(
    creditScore,
    interest_rate,
    customer,
    totalCurrentLoanEMI
  );

  if (approval) {
    const newLoan = await Loan.create({ customer_id, loan_id, interest_rate, tenure });
    res.status(201).json({
      loan_id: newLoan.loan_id,
      customer_id: newLoan.customer_id,
      loan_approved: approval,
      message: 'Loan created successfully!',
      monthly_installment: monthlyInstallment,
    });
  } else {
    res.status(403).json({
      loan_id,
      customer_id,
      loan_approved: approval,
      message: `The loan for customer Id: ${customer_id} has not been approved!`,
      monthly_installment: 0,
    });
  }
});
