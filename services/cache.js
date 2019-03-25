const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

// client.flushall();

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key) || '';
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), 
    {collection: this.mongooseCollection.name
  }));
  
  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    // this converts JS object to a mongoose model that we can return
    return Array.isArray(doc) 
      ? doc.map(d => new this.model(d))
      : new this.model(doc);

  }

  const result = await exec.apply(this, arguments);

  // result is a mongoose object, so we need to convert it to a string to use with redis
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);

  // but we want to return a mongoose object as usual from this monkey-patched function
 
  return result;
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}