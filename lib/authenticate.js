const jwt = require('jsonwebtoken');

const config = require('./../config');

const middleware = function (req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send({ auth : false, message : 'No token provided.', endpoint : req.route.path });

  jwt.verify(token, config.masterAuthSecret, (err, decoded) => {
    if (err) return res.status(500).send({ auth : false, message : 'Failed to authenticate token.', endpoint : req.route.path });
    next();
  });
};

module.exports = { middleware };
