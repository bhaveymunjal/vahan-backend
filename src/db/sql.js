const {Sequelize} = require("sequelize");
const dotenv = require("dotenv").config();

const dbName = process.env.DB_NAME || "vahanassignment";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "1234"
const dbHost = process.env.DB_HOST || "localhost"
;
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "mysql"
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected.");
    
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
module.exports = sequelize;