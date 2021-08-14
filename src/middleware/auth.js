const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { UNAUTHORIZED_CODE } = require('../config');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async function (req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;

    next();
  } catch (err) {
    res.status(UNAUTHORIZED_CODE).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
