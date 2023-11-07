const path = require('path');
const XLSX = require('xlsx');

function getCustomerDataFromXLfile() {
  const customerData = XLSX.readFile(path.join(process.cwd(), 'data/customer_data.xlsx'));
  return XLSX.utils.sheet_to_json(customerData.Sheets['Sheet1']);
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

module.exports = {
  calculateCreditScore,
  determineLoanEligibility,
  calculateMonthlyInstallment,
  getCustomerDataFromXLfile,
};
