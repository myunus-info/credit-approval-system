const path = require('path');
require('dotenv').config();
const { Sequelize } = require('sequelize');
const nodeCache = require(path.join(process.cwd(), 'src/config/lib/nodecache'));

const DB_HOST = nodeCache.getValue('DB_HOST');
const DB_NAME = nodeCache.getValue('DB_NAME');
const DB_USER = nodeCache.getValue('DB_USER');
const DB_PASSWORD = nodeCache.getValue('DB_PASSWORD');

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'postgres',
  logging: false,
  sync: true,
});

module.exports = sequelize;
