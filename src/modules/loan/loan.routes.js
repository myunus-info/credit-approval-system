const { createLoan, viewLoan } = require('./loan.controller');

module.exports = app => {
  app.post('/create-loan', createLoan);
  app.get('/view-loan/:loan_id', viewLoan);
};
