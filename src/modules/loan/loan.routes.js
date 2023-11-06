const { createLoan } = require('./loan.controller');

module.exports = app => {
  app.post('/create-loan', createLoan);
};
