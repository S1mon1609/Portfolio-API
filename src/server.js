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

app.get('/records', (req, res) => {
    fs.readFile('src/records.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      try {
        const records = JSON.parse(data);
        console.log("Yan ist ein kek");
        res.json(records);
      } catch (parseError) {
        console.error(parseError);
        res.status(500).json({ error: 'Error parsing JSON' });
      }
    });
  });
  
  app.post('/records', (req, res) => {
    const newRecord = req.body;
  
    if (!validateRecord(newRecord)) {
      res.status(400).json({ error: 'Ungültiger Datensatz' });
      return;
    }
  
    fs.readFile('src/records.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      try {
        const existingRecords = JSON.parse(data);
  
        const id = generateId();
  
        newRecord.id = id;
  
        const recordsArray = Array.isArray(existingRecords) ? existingRecords : [existingRecords];
  
        recordsArray.push(newRecord);
  
        fs.writeFile('src/records.json', JSON.stringify(recordsArray), 'utf8', (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }
  
          const header = getRecordUrl(req, id);
          res.status(201).location(header).json({ success: true });
        });
      } catch (parseError) {
        console.error(parseError);
        res.status(500).json({ error: 'Error parsing JSON' });
      }
    });
  });
  
  app.delete('/records', (req, res) => {

    const emptyRecord = {items: []} 

    fs.writeFile('src/records.json', JSON.stringify(emptyRecord), 'utf8', (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      
      res.status(204).send();
  
    
    });
  });

  app.get('/records/:id', (req, res) => {

    const id = req.params.id;

    fs.readFile('src/records.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server-Fehler.' });
      }
  
    const items = JSON.parse(data).items;

    const item = items.find(item => item.id === id)

    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Datensatz nicht gefunden.' });
      }
    });
  });

app.delete('/records/:id', (req, res) => {
  const id = req.params.id;

  fs.readFile('src/records.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server-Fehler.' });
    }
  
  const items = JSON.parse(data).items;

  const item = items.findIndex(item => item.id === id)

    if (item !== -1) {
      items.splice(item, 1);
      data.items = items
      fs.writeFile('src/records.json', JSON.stringify(data), 'utf8', err => { 
        if (err) {
          res.status(500).json({ error: 'Server-Fehler.' });
        } else {
          res.status(204).send("Power record deleted successfully.");
        }
      });
    } else {
      res.status(404).json('The power record with the given ID does not exist.')
    }
  });
}); 
