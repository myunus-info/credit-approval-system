const { createLoan, viewLoan, makePayment, viewStatement } = require('./loan.controller');

module.exports = app => {
  app.post('/create-loan', createLoan);
  app.get('/view-loan/:loan_id', viewLoan);
  app.post('/make-payment/:customer_id/:loan_id', makePayment);
  app.get('/view-statement/:customer_id/:loan_id', viewStatement);
};
