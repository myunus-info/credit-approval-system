const path = require('path');
const XLSX = require('xlsx');
const async = require('async');

async function init() {
  const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
  const { initEnvironmentVariables } = require(path.join(process.cwd(), 'src/config/config'));
  await initEnvironmentVariables();
  const Customer = require(path.join(process.cwd(), 'src/modules/customer/customer.model'));
  const Loan = require(path.join(process.cwd(), 'src/modules/loan/loan.model'));
  sequelize.sync({ alter: true });

  const customerData = XLSX.readFile('data/customer_data.xlsx');
  const loanData = XLSX.readFile('data/loan_data.xlsx');

  const customers = XLSX.utils
    .sheet_to_json(customerData.Sheets['Sheet1'])
    // .slice(0, 3)
    .map(({ customer_id, first_name, last_name, age, phone_number, monthly_salary: monthly_income }) => {
      return {
        customer_id,
        first_name,
        last_name,
        age,
        phone_number,
        monthly_income,
      };
    });

  const loans = XLSX.utils
    .sheet_to_json(loanData.Sheets['Sheet1'])
    // .slice(0, 3)
    .map(({ loan_id, customer_id, loan_amount, interest_rate, tenure }) => {
      return { loan_id, customer_id, loan_amount, interest_rate, tenure };
    })
    .reduce((loansArray, currLoan) => {
      const loanItem = loansArray.find(loan => loan.loan_id === currLoan.loan_id);
      if (loanItem) {
        return loansArray;
      }
      return loansArray.concat([currLoan]);
    }, []);

  function customerSeeder(callback) {
    Customer.destroy({ truncate: { cascade: true } }).then(() => {
      Customer.bulkCreate(customers, {
        returning: true,
        ignoreDuplicates: false,
      }).then(() => {
        callback();
      });
    });
  }

  function loanSeeder(callback) {
    Loan.destroy({ truncate: { cascade: true } }).then(() => {
      Loan.bulkCreate(loans, {
        returning: true,
        ignoreDuplicates: false,
      }).then(() => {
        callback();
      });
    });
  }

  async.waterfall([customerSeeder, loanSeeder], err => {
    if (err) console.error(err);
    else console.info('DB seed completed!');
    process.exit();
  });
}

init();
