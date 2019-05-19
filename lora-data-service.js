const AWS = require('aws-sdk');

let loraDataTableName;

class LoraDataService {

  constructor() {
    this.dynamodbDocClient = new AWS.DynamoDB.DocumentClient();

    console.log('Getting status table name');
    if(process.env.LORA_DATA_TABLE && process.env.LORA_DATA_TABLE !== 'NONE') {
      loraDataTableName = process.env.LORA_DATA_TABLE;
      console.log('LoRa Data Table Name: ' + loraDataTableName);
    }
  }

  async readLoraData() {
    console.log('Getting all data');
    const params = {
      TableName: loraDataTableName,
      ProjectionExpression: 'message'
    };

    try {
      return await this.dynamodbDocClient.scan(params).promise();
    } catch (err) {
      throw err;
    }
  };

  async createLoraData(loraMessage) {
    console.log(`Creating record for reading ${loraMessage}`);
    const msgObject = JSON.parse(loraMessage);

    const params = {
      TableName: loraDataTableName,
      Item: {
        'time': msgObject.metadata.time,
        'message': msgObject
      }
    };

    try {
      return await this.dynamodbDocClient.put(params).promise();gith
    } catch (err) {
      throw err;
    }
  };
}

class Singleton {
  constructor() {
    if (!Singleton.instance) {
      Singleton.instance = new LoraDataService();
    }
  }

  getInstance() {
    return Singleton.instance;
  }
}

module.exports = Singleton;

module.exports.service = LoraDataService;
