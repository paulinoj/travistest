const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  // user is a mongoose model
  // user._id is a javascript object containing the id
  // user._id.toString() returns the id inside the javascript object
  const sessionObject = {
    passport: {
      user: user._id.toString()
    }
  };
  const session = Buffer.from(
    JSON.stringify(sessionObject)
    ).toString('base64');

  const sig = keygrip.sign('session=' + session);

  return {
    session,
    sig
  };
};