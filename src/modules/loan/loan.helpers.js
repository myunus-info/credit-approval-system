const path = require('path');
const XLSX = require('xlsx');

function getLoanDataFromXLfile() {
  const loanData = XLSX.readFile(path.join(process.cwd(), 'data/loan_data.xlsx'));
  return XLSX.utils.sheet_to_json(loanData.Sheets['Sheet1']);
}

module.exports = {
  getLoanDataFromXLfile,
};
