const path = require('path');
const Loan = require('./loan.model');
const Customer = require(path.join(process.cwd(), 'src/modules/customer/customer.model'));
const { asyncHandler, AppError } = require(path.join(process.cwd(), '/src/modules/core/errors'));
const {
  calculateCreditScore,
  determineLoanEligibility,
  calculateTotalCurrentLoanEMIs,
  calculateMonthlyInstallment,
  recalculateEMIAmount,
  getLoanDataFromXLfile,
  calculateAmountRepaid,
  calculateRepaymentsLeft,
} = require('./loan.helpers');

exports.createLoan = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_id, loan_amount, interest_rate, tenure } = req.body;

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
    const existingLoan = await Loan.findByPk(loan_id);
    if (existingLoan) {
      return next(new AppError(400, `Loan with Id: (${loan_id}) already exists!`));
    }
    const newLoan = await Loan.create({ customer_id, loan_id, loan_amount, interest_rate, tenure });
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
      message: `The loan for customer Id: (${customer_id}) has not been approved!`,
      monthly_installment: 0,
    });
  }
});

exports.viewLoan = asyncHandler(async (req, res, next) => {
  try {
    const { loan_id: loanId } = req.params;
    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return next(new AppError(404, `No loan found with Id: (${loanId})`));
    }
    const { loan_id, loan_amount, interest_rate, tenure, customer_id: customerId } = loan;
    const customer = await Customer.findByPk(customerId);
    const { customer_id, first_name, last_name, age, phone_number } = customer;

    const loans = getLoanDataFromXLfile();
    const customerLoans = loans.filter(loan => loan.customer_id === customer_id);
    const creditScore = calculateCreditScore(customer, customerLoans);
    const totalCurrentLoanEMI = calculateTotalCurrentLoanEMIs(customerLoans);
    const monthlyInstallment = calculateMonthlyInstallment(loan_amount, interest_rate, tenure);
    const { approval, interestRate } = determineLoanEligibility(
      creditScore,
      interest_rate,
      customer,
      totalCurrentLoanEMI
    );

    res.status(200).json({
      loan_id,
      customer: {
        customer_id,
        first_name,
        last_name,
        phone_number,
        age,
      },
      loan_amount: approval,
      interest_rate: interestRate,
      monthly_installment: monthlyInstallment,
      tenure,
    });
  } catch (err) {
    return next(new AppError(500, 'Internal server error!'));
  }
});

exports.makePayment = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_id } = req.params;
  const { payment_amount } = req.body;
  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return next(new AppError(404, 'No customer found!'));
  }
  const loan = await Loan.findByPk(loan_id);
  if (!loan) {
    return next(new AppError(404, 'No loan found!'));
  }

  const dueInstallmentAmount = calculateMonthlyInstallment(
    loan.loan_amount,
    loan.interest_rate,
    loan.tenure
  );

  const paymentAmount = parseFloat(payment_amount);
  const emiAmount = recalculateEMIAmount(dueInstallmentAmount, paymentAmount, loan.tenure);

  await loan.update({ loan_amount: loan.loan_amount - emiAmount });
  res.status(200).json(loan);
});

exports.viewStatement = asyncHandler(async (req, res, next) => {
  const { customer_id, loan_id } = req.params;
  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return next(new AppError(404, 'No customer found!'));
  }

  const loans = getLoanDataFromXLfile();
  const customerLoans = loans.filter(loan => loan.customer_id === customer.customer_id);
  if (!customerLoans || customerLoans.length < 1) {
    return next(new AppError(500, 'No loans found for this customer!'));
  }

  const loanData = customerLoans.map(loan => {
    const creditScore = calculateCreditScore(customer, customerLoans);
    const totalCurrentLoanEMI = calculateTotalCurrentLoanEMIs(customerLoans);
    const { _, interestRate } = determineLoanEligibility(
      creditScore,
      loan.interest_rate,
      customer,
      totalCurrentLoanEMI
    );
    const amountsRepaid = calculateAmountRepaid(loan);
    return {
      customer_id: loan.customer_id,
      loan_id: loan.loan_id,
      principal: loan.loan_amount,
      interest_rate: interestRate,
      Amount_paid: amountsRepaid,
      monthly_installment: calculateMonthlyInstallment(
        loan.loan_amount,
        loan.interest_rate,
        loan.tenure
      ),
      repayments_Left: calculateRepaymentsLeft(loan, amountsRepaid),
    };
  });

  res.status(200).json(loanData);
});
