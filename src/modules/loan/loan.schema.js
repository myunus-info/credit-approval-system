const { number, object } = require('yup');

const loanSchema = object().shape({
  loan_id: number().required('This field must not be empty.'),
  customer_id: number().required('This field must not be empty.'),
  loan_amount: number().required('This field must not be empty.'),
  interest_rate: number().required('This field must not be empty.'),
  tenure: number().required('This field must not be empty.'),
});

module.exports = loanSchema;
