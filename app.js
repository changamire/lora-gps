    
const express = require('express');
const cors = require('cors');
const sls_http = require('serverless-http');

const LoraDataService = require('./lora-data-service');

const loraDataDervice = new LoraDataService().getInstance();
const app = express();

app.use(cors());

app.get('/', async (req, res) => {
  let points = await getAllMessages();
  res.json(points);
});

app.post('/', async (req, res) => {
 res.send(await handleMessage(req.body));
});

handleMessage = async (data) => {
  console.log('Handling message ' + data);
  await loraDataDervice.createLoraData(data);
  console.log('LoRa msg persisted');
};

getAllMessages = async () => {
  let allMessages = await loraDataDervice.readLoraData();
  let results = {};
  for (let msg of allMessages.Items) {
    results[msg.message.metadata.time] = [[msg.message.payload_fields.gps_3.latitude,
      msg.message.payload_fields.gps_3.longitude],13];
  }
  return results;
};

module.exports = app;
module.exports.awsLambdaHandler = sls_http(app);
