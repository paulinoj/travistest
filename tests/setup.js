// Wait 30 seconds before ending any test instead of default 5 seconds
jest.setTimeout(30000);

require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;

// set useMongoClient: true to avoid deprecation warning
mongoose.connect(keys.mongoURI, { useMongoClient: true });

// to get Jest to run this file whenever it starts up, we need the code below in
// the package.json file:
// "jest": {
//   "setupTestFrameworkScriptFile": "./tests/setup.js"
// }
