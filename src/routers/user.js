const express = require('express');
const router = express.Router();
const con = require('../db/sql');
const bodyParser = require('body-parser');

router.use(bodyParser.json());

// Get all entities
router.get('/all', async (req, res) => {
  try {
    const [results] = await con.query('SHOW TABLES');
    const tableNames = results.map((result) => Object.values(result)[0]);
    res.json(tableNames);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).send('Error fetching tables');
  }
});

// Create a new entity
router.post('/new', async (req, res) => {
  const { name, attributes } = req.body;
  if (!name || !attributes)
    return res.status(400).send('Name and attributes are required.');

  // Build the CREATE TABLE query
  let createTableQuery = `CREATE TABLE \`${name}\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,`;
  const columns = [];
  for (const attr of attributes) {
    let columnDefinition;
    switch (attr.type) {
      case 'string':
        columnDefinition = `\`${attr.name}\` VARCHAR(255)`;
        break;
      case 'number':
        columnDefinition = `\`${attr.name}\` BIGINT`;
        break;
      case 'date':
        columnDefinition = `\`${attr.name}\` DATE`;
        break;
      case 'boolean':
        columnDefinition = `\`${attr.name}\` BOOLEAN`;
        break;
      case 'float':
        columnDefinition = `\`${attr.name}\` FLOAT`;
        break;
      case 'text':
        columnDefinition = `\`${attr.name}\` TEXT`;
        break;
      default:
        return res.status(400).send(`Unsupported attribute type: ${attr.type}`);
    }
    columns.push(columnDefinition);
  }
  createTableQuery += columns.join(', ') + ');';

  // Execute the query
  try {
    await con.query(createTableQuery);
    res.status(201).send(`Entity ${name} created.`);
  } catch (error) {
    console.error(`Error creating table for entity ${name}:`, error);
    res.status(500).send('Internal server error');
  }
});

// Get all records for an entity
router.get('/:entity', async (req, res) => {
  const { entity } = req.params;
  try {
    const [results] = await con.query(`SELECT * FROM \`${entity}\``);
    res.json(results);
  } catch (error) {
    console.error(`Error fetching records for entity ${entity}:`, error);
    res.status(500).send('Error fetching records');
  }
});

// Create a new record for an entity
router.post('/:entity', async (req, res) => {
  const { entity } = req.params;
  const data = req.body;
  data.createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  data.updatedAt = data.createdAt;

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  try {
    const [results] = await con.query(
      `INSERT INTO \`${entity}\` (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    res.status(201).json({ id: results.insertId });
  } catch (error) {
    console.error(`Error creating record for entity ${entity}:`, error);
    res.status(400).send(error.sqlMessage);
  }
});

// Update a record for an entity
router.put('/:entity/:id', async (req, res) => {
  const { entity, id } = req.params;
  const data = req.body.data;
  data.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Remove createdAt from data to avoid updating it
  delete data.createdAt;

  const setClause = Object.entries(data)
    .map(([key, value]) => `\`${key}\` = ?`)
    .join(', ');
  const values = [...Object.values(data), id]; // Pass only values without the object

  const updateQuery = `UPDATE \`${entity}\` SET ${setClause} WHERE id = ?`;

  console.log('Executing query:', updateQuery);
  console.log('With values:', values);

  try {
    await con.query(updateQuery, values);
    res.status(200).send('Record updated successfully');
  } catch (error) {
    console.error(`Error updating record for entity ${entity}:`, error);
    res.status(400).send(error.sqlMessage);
  }
});


// Delete a record for an entity
router.delete('/:entity/:id', async (req, res) => {
  const { entity, id } = req.params;
  try {
    await con.query(`DELETE FROM \`${entity}\` WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (error) {
    console.error(`Error deleting record for entity ${entity}:`, error);
    res.status(500).send('Error deleting record');
  }
});

// Get columns for an entity
router.get('/columns/:entity', async (req, res) => {
  const { entity } = req.params;
  try {
    const [results] = await con.query(`DESC \`${entity}\``);
    // Extract column names and types
    const columns = results.map((result) => ({
      name: result.Field,
      dataType: parseDataType(result.Type),
    }));
    res.json(columns);
  } catch (error) {
    console.error('Error fetching column metadata:', error);
    res.status(500).send('Error fetching column metadata');
  }
});

// Function to parse SQL data type
const parseDataType = (sqlType) => {
  if (
    sqlType.includes('varchar') ||
    sqlType.includes('char') ||
    sqlType.includes('text')
  ) {
    return 'text';
  } else if (
    sqlType.includes('int') ||
    sqlType.includes('decimal') ||
    sqlType.includes('float')
  ) {
    return 'number';
  } else if (
    sqlType.includes('date') ||
    sqlType.includes('time') ||
    sqlType.includes('year')
  ) {
    return 'date';
  } else {
    return 'text';
  }
};

module.exports = router;
