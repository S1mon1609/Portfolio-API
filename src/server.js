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
  // read of the existing JSON-File
    fs.readFile('src/records.json', 'utf8', (err, data) => {
      // check that file has been read successfully
      if (err) {
        console.error(err);
        res.status(500).send();
        return;
      }
      
      //Parse-JSON, send parsed JSON as the respons, in cas parse is unsuccsessfull send 500 response
      try {
        const records = JSON.parse(data);
        res.json(records);
      } catch (parseError) {
        console.error(parseError);
        res.status(500).send();
      }
    });
  });
  
app.post('/records', (req, res) => {
  // save given record as variable
  const newRecord = req.body;
  
  // validate that record has all and only the required data
  if (!validateRecord(newRecord)) {
    res.status(400).send();
    return;
  }
  // read of the existing JSON-File
  fs.readFile('src/records.json', 'utf8', (err, data) => {
    // check that file has been read successfully
    if (err) {
      console.error(err);
      res.status(500).send();
      return;
      //given record receives an id and is added to the parsed JSON document
    } else {
      const jsonData = JSON.parse(data);
      let newItem = req.body;
      const id = generateId()
      newItem.id = id;
  
      jsonData.items.push(newRecord);
      
      // JSON with new record is wrote back into the json file. If stringify or write fails a 500 response is given. If it is successfull a response is given that includes a header with the received id of the new record.
      fs.writeFile('src/records.json', JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        if (err) {
          console.error(err);
          res.status(500).send();
          return;
        } else {
          const header = getRecordUrl(req, id);
          res.status(201).location(header);
        }
      });
    }
  });
});
  
app.delete('/records', (req, res) => {

  //empty JSON is created as a variable
  const emptyRecord = {items: []} 

  //empty JSON is wrote into the existing JSON document and replaces all existing records. If writte or stringify are unsuccessfull a 500 response is given. If everything is successfull a 204 response is given confirming the delete.
  fs.writeFile('src/records.json', JSON.stringify(emptyRecord, null, 2), 'utf8', (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
      
    res.status(204).send("All power records deleted succesfully.");
  
    
  });
});

app.get('/records/:id', (req, res) => {
  // id given in request is saved.
  const id = req.params.id;

  // read of the existing JSON-File
  fs.readFile('src/records.json', 'utf8', (err, data) => {
    // check that file has been read successfully
    if (err) {
      console.error(err);
      return res.status(500).send();
    }
  
  //Parsed JSON is saved as a constant
  const items = JSON.parse(data).items;

  //search object with given id within the JSON
  const item = items.find(item => item.id === id)

  //If id is found record with id is in a 200 response. If record is not found a 404 response is given.
  if (item) {
    res.json(item);
  } else {
    res.status(404).send();
    }
  });
});

app.delete('/records/:id', (req, res) => {
  // id given in request is saved.
  const id = req.params.id;

  // read of the existing JSON-File
  fs.readFile('src/records.json', 'utf8', (err, data) => {
    // check that file has been read successfully
    if (err) {
      console.error(err);
      return res.status(500).send();
    } else {
  
    //save JSON as variable  
    let jsonData = JSON.parse(data);

    // find record with given element
    const index = jsonData.items.findIndex(item => item.id === id);

    // remove found record an write all records without the removed one back into the JSON document. If unsuccsessfull 500 response is given. If successfull 204 response is given confirming deletion. If no record with the given id is found 404 error is given.
    if (index !== -1) {
      jsonData.items.splice(index, 1);
      fs.writeFile('src/records.json', JSON.stringify(jsonData, null, 2), 'utf8', err => {
        if (err) {
          res.status(500).send();
        } else {
          res.status(204).send("Power record deleted successfully.");
        }
      });
    } else {
      res.status(404).send();
    }
  }
});
});