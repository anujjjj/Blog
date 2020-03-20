const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
var Redis = require("ioredis");

const { exec } = mongoose.Query.prototype;
// Setup REDIS + promisify get function
// const redisUrl = 'redis://127.0.0.1:6379';
// const client = redis.createClient(redisUrl)
var client = new Redis.Cluster([
  {
    port: 7000,
    host: "127.0.0.1"
  },
  {
    port: 7001,
    host: "127.0.0.1"
  },
  {
    port: 7002,
    host: "127.0.0.1"
  },
  {
    port: 7003,
    host: "127.0.0.1"
  },
  {
    port: 7004,
    host: "127.0.0.1"
  },
  {
    port: 7005,
    host: "127.0.0.1"
  }
]);


client.hget = util.promisify(client.hget);

// REMINDER https://bit.ly/2qEmUkN
// Arrow function vs function declaration / expressions:
// Are they equivalent / exchangeable?
// Arrow functions and function declarations / expressions
// are not equivalent and cannot be replaced blindly.
// If the function you want to replace does not use this,
// arguments and is not called with new, then yes.

mongoose.Query.prototype.cache = function cache(options = {}) {
  // this equals query instance
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  console.log("hash ", this.hashKey);
  console.log("options ", options.key)

  // return makes it chainable
  return this;
};

mongoose.Query.prototype.exec = async function execAndCache(...args) {
  if (!this.useCache) {
    return exec.apply(this, args);
  }
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));
  // Search cache
  const hkey = this.hashkey;
  console.log("hkey ", hkey);
  console.log("key ", key);
  const cachedValue = await client.hget(this.hashKey, key);
  if (cachedValue) {

    console.log("CACHE");

    // Function expects to return a Mongoose object.
    // Mongoose model with properties like get, get, etc.
    const doc = JSON.parse(cachedValue);
    console.log(doc)

    /* eslint-disable */
    const cachedDocument = Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
    /* eslint-enable */
    return cachedDocument;
  }

  // If not there execute query and cache result.
  console.log("MONGO");
  const result = await exec.apply(this, args);
  client.hset(this.hashKey, key, JSON.stringify(result));
  return result;
};

const clearHash = (hashKey) => {
  client.del(JSON.stringify(hashKey));
};

module.exports = {
  clearHash
};
