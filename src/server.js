const fs = require('fs');
const express = require("express");
const crypto = require("crypto");

const app = express();

app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('yaml').parse(fs.readFileSync('./spec/powertrack.yaml', 'utf8'));
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(8080, () => {
    console.log("Server up and running");
});

function generateId() {
    return crypto.randomUUID();
}
function getRecordUrl(req, recordId) {
    return `${req.protocol}://${req.header('host')}/records/${recordId}`;
}

function validateRecord(record) {
    const dateRegex = new RegExp("^\\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$");
    return record &&
        record.date && typeof record.date === "string" && dateRegex.test(record.date) &&
        record.reading && typeof record.reading === "number";
}

function readRecordsFromFile(){
  try {
      const data = fs.readFileSync('src/records.json', 'utf-8');
      return JSON.parse(data);
  } catch (err) {
      console.error('Error reading records from file:', err);
      return {};
  }
}

app.get("src/records", req, res =>{
  console.log("Get-Function")
  const items = readRecordsFromFile
  res.status(200).json(items)
});
