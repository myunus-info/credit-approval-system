const path = require('path');
const XLSX = require('xlsx');

function getLoanDataFromXLfile() {
  const loanData = XLSX.readFile(path.join(process.cwd(), 'data/loan_data.xlsx'));
  return XLSX.utils.sheet_to_json(loanData.Sheets['Sheet1']);
}

function calculateCreditScore(customer, historicalLoans) {
  let creditScore = 0;

  // Past Loans paid on time
  let totalEMIs = 0;
  let totalEMIsPaidOnTime = 0;
  for (const loan of historicalLoans) {
    totalEMIs += loan.tenure;
    totalEMIsPaidOnTime += loan['EMIs paid on Time'];
  }
  const percentageOfEMIsPaidOnTime = (totalEMIsPaidOnTime / totalEMIs) * 100;
  if (percentageOfEMIsPaidOnTime === 100) creditScore += 40;
  else if (percentageOfEMIsPaidOnTime >= 90) creditScore += 30;
  else if (percentageOfEMIsPaidOnTime >= 80) creditScore += 20;

  // No of loans taken in past
  creditScore += Math.min(historicalLoans.length * 5, 30);

  // Loan activity in current year
  const loansInCurrentYear = historicalLoans.filter(
    loan => new Date(loan.start_date).getFullYear() === new Date().getFullYear()
  );
  creditScore -= loansInCurrentYear.length * 5;

  // Loan approved volume
  let totalLoanAmount = 0;
  for (const loan of historicalLoans) {
    totalLoanAmount += loan.loan_amount;
  }
  const creditUtilizationRatio = totalLoanAmount / customer.approved_limit;
  if (creditUtilizationRatio <= 0.3) creditScore += 30;
  else if (creditUtilizationRatio <= 0.5) creditScore += 25;
  else if (creditUtilizationRatio <= 0.7) creditScore += 20;

  // If sum of current loans of customer > approved limit of customer, credit score = 0
  if (loansInCurrentYear.length > customer.approved_limit) {
    creditScore = 0;
  }

  // Credit Score should be a whole number not a fraction
  return Math.floor(creditScore);
}

function calculateTotalCurrentLoanEMIs(historicalLoans) {
  let totalCurrentLoanEMI = 0;
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const currentYearEnd = new Date(new Date().getFullYear(), 11, 31).getTime();
  for (const loan of historicalLoans) {
    if (
      new Date(loan.start_date).getTime() <= currentYearStart &&
      new Date(loan.end_date).getTime() >= currentYearEnd
    ) {
      totalCurrentLoanEMI += loan.monthly_payment;
    }
  }
  return totalCurrentLoanEMI;
}

function calculateMonthlyInstallment(loanAmount, interestRate, tenure) {
  const monthlyInterestRate = interestRate / 12 / 100;
  const monthlyInstallment =
    (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) /
    (Math.pow(1 + monthlyInterestRate, tenure) - 1);

  return +monthlyInstallment.toFixed(2);
}

function recalculateEMIAmount(dueInstallmentAmount, paymentAmount, tenure) {
  if (paymentAmount > dueInstallmentAmount) {
    return dueInstallmentAmount;
  }

  const remainingLoan = dueInstallmentAmount - paymentAmount;
  const monthlyInterestRate = dueInstallmentAmount / 12 / 100;
  // const remainingTenure = 12;

  const monthlyInstallment = calculateMonthlyInstallment(remainingLoan, monthlyInterestRate, tenure);

  return monthlyInstallment;
}

function determineLoanEligibility(creditScore, interest_rate, customer, totalCurrentLoanEMI) {
  let interestRate = interest_rate;
  let approval = false;

  if (creditScore > 50) {
    interestRate = interest_rate;
    approval = true;
  } else if (creditScore < 50 && creditScore > 30) {
    interestRate > 12 ? (interestRate = interest_rate) : (interestRate = 12);
    approval = true;
  } else if (creditScore < 30 && creditScore > 10) {
    interestRate > 16 ? (interestRate = interest_rate) : (interestRate = 16);
    approval = true;
  } else if (totalCurrentLoanEMI > 0.5 * customer.monthly_salary) {
    interestRate = 0;
    approval = false;
  } else {
    interestRate = 0;
    approval = false;
  }

  return { interestRate, approval };
}

function calculateAmountRepaid(loan) {
  const emisPaidOnTime = loan['EMIs paid on Time'];
  const monthlyInstallment = calculateMonthlyInstallment(
    loan.loan_amount,
    loan.interest_rate,
    loan.tenure
  );

  return emisPaidOnTime * monthlyInstallment;
}

function calculateRepaymentsLeft(loan, amountsRepaid) {
  const monthlyInstallment = calculateMonthlyInstallment(
    loan.loan_amount,
    loan.interest_rate,
    loan.tenure
  );
  const totalInstallments = loan.tenure;
  const repaymentsLeft = Math.max(totalInstallments - Math.floor(amountsRepaid / monthlyInstallment), 0);

  return repaymentsLeft;
}

module.exports = {
  calculateCreditScore,
  calculateTotalCurrentLoanEMIs,
  calculateMonthlyInstallment,
  recalculateEMIAmount,
  getLoanDataFromXLfile,
  determineLoanEligibility,
  calculateAmountRepaid,
  calculateRepaymentsLeft,
};
