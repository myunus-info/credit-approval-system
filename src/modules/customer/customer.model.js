const path = require('path');
const sequelize = require(path.join(process.cwd(), 'src/config/lib/sequelize'));
const { DataTypes } = require('sequelize');

const Customer = sequelize.define('Customer', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  },
  first_name: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  last_name: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  monthly_income: {
    allowNull: false,
    type: DataTypes.NUMBER,
  },
  phone_number: {
    allowNull: false,
    type: DataTypes.NUMBER,
  },
});

module.exports = Customer;
