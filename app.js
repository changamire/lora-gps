    
const express = require('express');
const sls_http = require('serverless-http');

const app = express();

app.post('/', (req, res) => {
 res.send(handleMessage(req.body));
});

handleMessage = (data) => {
  console.log('Handling message ' + data);
};

module.exports = app;
module.exports.awsLambdaHandler = sls_http(app);
