const path = require('path');
const customerSchema = require('./customer.schema');
const validate = require(path.join(process.cwd(), 'src/modules/core/middlewares/validate.middleware'));
const { registerCustomer, checkLoanEligibility } = require('./customer.controller');

module.exports = app => {
  app.post('/register', validate(customerSchema), registerCustomer);
  app.post('/check-eligibility', checkLoanEligibility);
};
