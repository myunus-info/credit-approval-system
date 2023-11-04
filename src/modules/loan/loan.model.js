const path = require('path');
const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
const { DataTypes } = require('sequelize');
const Customer = require('../customer/customer.model');

const Loan = sequelize.define('Loan', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  },
  loan_amount: {
    allowNull: false,
    type: DataTypes.FLOAT,
  },
  interest_rate: {
    allowNull: false,
    type: DataTypes.FLOAT,
  },
  tenure: {
    allowNull: false,
    type: DataTypes.NUMBER,
  },
});

Customer.hasMany(Loan, { foreignKey: 'customer_id', allowNull: false });
Loan.belongsTo(Customer);

module.exports = Loan;
