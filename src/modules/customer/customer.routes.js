const path = require('path');
const { registerCustomer, checkLoanEligibility } = require('./customer.controller');

module.exports = app => {
  app.post('/register', registerCustomer);
  app.post('/check-eligibility', checkLoanEligibility);
};
