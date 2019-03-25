const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  // TRICK FOR HAVING THIS MIDDLEWARE EXECUTE AFTER ROUTE HANDLER  
  await next();
  clearHash(req.user.id)
}