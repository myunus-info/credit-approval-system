const path = require('path');
// const XLSX = require('xlsx');
const async = require('async');
const { getCustomerDataFromXLfile } = require(path.join(
  process.cwd(),
  'src/modules/customer/customer.helpers'
));
const { getLoanDataFromXLfile } = require(path.join(process.cwd(), 'src/modules/loan/loan.helpers'));

async function init() {
  const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
  const Customer = require(path.join(process.cwd(), 'src/modules/customer/customer.model'));
  const Loan = require(path.join(process.cwd(), 'src/modules/loan/loan.model'));
  const { initEnvironmentVariables } = require(path.join(process.cwd(), 'src/config/config'));
  await initEnvironmentVariables();
  await sequelize.sync({ alter: true });

  const customers = getCustomerDataFromXLfile().map(
    ({ customer_id, first_name, last_name, age, phone_number, monthly_salary: monthly_income }) => {
      return {
        customer_id,
        first_name,
        last_name,
        age,
        phone_number,
        monthly_income,
      };
    }
  );

  const loans = getLoanDataFromXLfile()
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
