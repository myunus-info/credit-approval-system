const { string, number, object } = require('yup');

const customerSchema = object().shape({
  customer_id: number().required('This field must not be empty.'),
  first_name: string()
    .max(100, 'This field must be at most 100 characters long.')
    .required('This field must not be empty.'),
  last_name: string()
    .max(100, 'This field must be at most 100 characters long.')
    .required('This field must not be empty.'),
  age: number().max(100, 'This field must be at most 100.').required('This field must not be empty.'),
  phone_number: number().required('This field must not be empty.'),
  monthly_income: number().required('This field must not be empty.'),
});

module.exports = customerSchema;
