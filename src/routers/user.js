const express = require("express");
const router = express.Router();
const sequelize = require("../db/sql.js");
const { DataTypes } = require("sequelize");
const bodyParser = require("body-parser");

router.use(bodyParser.json());

// Dynamic models storage
const models = {};

// Get all entities
router.get("/all", async (req, res) => {
  try {
    const [results] = await sequelize.query("SHOW TABLES");
    const tableNames = results.map((result) => Object.values(result)[0]);
    res.json(tableNames);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).send("Error fetching tables");
  }
});

// Create a new entity
router.post("/new", async (req, res) => {
  const { name, attributes } = req.body;
  if (!name || !attributes)
    return res.status(400).send("Name and attributes are required.");

  // Define a new model
  const modelAttributes = {};
  for (const attr of attributes) {
    switch (attr.type) {
      case "string":
        modelAttributes[attr.name] = { type: DataTypes.STRING };
        break;
      case "number":
        modelAttributes[attr.name] = { type: DataTypes.INTEGER };
        break;
      case "date":
        modelAttributes[attr.name] = { type: DataTypes.DATE };
        break;
      case "boolean":
        modelAttributes[attr.name] = { type: DataTypes.BOOLEAN };
        break;
      case "float":
        modelAttributes[attr.name] = { type: DataTypes.FLOAT };
        break;
      case "text":
        modelAttributes[attr.name] = { type: DataTypes.TEXT };
        break;
      default:
        return res.status(400).send(`Unsupported attribute type: ${attr.type}`);
    }
  }

  const model = sequelize.define(name, modelAttributes);
  try {
    await model.sync();
    res.status(201).send(`Entity ${name} created.`);
  } catch (error) {
    console.error(`Error creating record for entity ${name}:`, error);
    res.status(500).send("Internal server error");
  }
});

// Get all records for an entity
router.get("/:entity", async (req, res) => {
  const { entity } = req.params;
  try {
    const [results] = await sequelize.query(`SELECT * FROM ${entity}`);
    res.json(results);
  } catch (error) {
    console.error(`Error fetching records for entity ${entity}:`, error);
    res.status(500).send("Error fetching records");
  }
});

// Create a new record for an entity
router.post("/:entity", async (req, res) => {
  const { entity } = req.params;
  const data = req.body;
  const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
  data.createdAt = currentDate;
  data.updatedAt = currentDate;

  // Construct the SET clause dynamically with properly quoted column names
  const setClause = Object.entries(data)
    .map(([key, value]) => `\`${key}\` = '${value}'`) // Wrap column names in backticks
    .join(", ");

  console.log(data);
  try {
    const [results] = await sequelize.query(
      `INSERT INTO \`${entity}\` SET ${setClause}`, // Wrap table name in backticks
      data
    );
    res.status(201).json({ id: results.insertId });
  } catch (error) {
    console.error(`Error creating record for entity ${entity}:`, error);
    res.status(400).send(error.original.sqlMessage);
  }
});

// Update a record for an entity
router.put("/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  const data = req.body.data;
  try {
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
    const createdAt = await sequelize.query(
      `SELECT createdAt FROM ${entity} WHERE id = ${id}`
    );
    data.createdAt = createdAt[0][0].createdAt
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    data.updatedAt = currentDate;
    const setClause = Object.entries(data)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(", ");

    await sequelize.query(`UPDATE ${entity} SET ${setClause} WHERE id = ${id}`);
    res.status(200).send("Record updated successfully");
  } catch (error) {
    console.error(
      `Error updating record for entity ${entity}:`,
      error.original
    );
    res.status(400).send(error.original.sqlMessage);
  }
});

// Delete a record for an entity
router.delete("/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  try {
    await sequelize.query(`DELETE FROM ${entity} WHERE id = ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting record for entity ${entity}:`, error);
    res.status(500).send("Error deleting record");
  }
});

// Get columns for an entity
router.get("/columns/:entity", async (req, res) => {
  const { entity } = req.params;
  try {
    const [results] = await sequelize.query(`DESC ${entity}`);
    // Extract column names and types
    const columns = results.map((result) => ({
      name: result.Field,
      dataType: parseDataType(result.Type), // Implement parseDataType function
    }));
    res.json(columns);
  } catch (error) {
    console.error("Error fetching column metadata:", error);
    res.status(500).send("Error fetching column metadata");
  }
});

// Function to parse SQL data type
const parseDataType = (sqlType) => {
  if (
    sqlType.includes("varchar") ||
    sqlType.includes("char") ||
    sqlType.includes("text")
  ) {
    return "text";
  } else if (
    sqlType.includes("int") ||
    sqlType.includes("decimal") ||
    sqlType.includes("float")
  ) {
    return "number";
  } else if (
    sqlType.includes("date") ||
    sqlType.includes("time") ||
    sqlType.includes("year")
  ) {
    return "date";
  } else {
    return "text";
  }
};

module.exports = router;
