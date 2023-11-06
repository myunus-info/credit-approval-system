const path = require('path');
const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
const { DataTypes } = require('sequelize');
const Customer = require('../customer/customer.model');

const Loan = sequelize.define(
  'Loan',
  {
    loan_id: {
      allowNull: false,
      primaryKey: true,
      unique: true,
      type: DataTypes.INTEGER,
    },
    loan_amount: {
      allowNull: false,
      type: DataTypes.DECIMAL(10, 2),
    },
    interest_rate: {
      allowNull: false,
      type: DataTypes.DECIMAL(10, 2),
    },
    tenure: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'loans',
    timestamps: false,
  }
);

Customer.hasMany(Loan, {
  foreignKey: {
    name: 'customer_id',
    type: DataTypes.INTEGER,
  },
});
Loan.belongsTo(Customer, {
  foreignKey: {
    name: 'customer_id',
    type: DataTypes.INTEGER,
  },
});

module.exports = Loan;
