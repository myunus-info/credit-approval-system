const path = require('path');
const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
const { DataTypes } = require('sequelize');

const Customer = sequelize.define(
  'Customer',
  {
    customer_id: {
      allowNull: false,
      primaryKey: true,
      unique: true,
      type: DataTypes.INTEGER,
    },
    first_name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    last_name: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    age: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    phone_number: {
      allowNull: false,
      type: DataTypes.BIGINT,
    },
    monthly_income: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'customers',
    timestamps: false,
  }
);

module.exports = Customer;
