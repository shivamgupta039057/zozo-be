const jwt = require('jsonwebtoken');
const { statusCode } = require('../../config/default.json');
const {UserModel} = require('../../pgModels');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(statusCode.UNAUTHORIZED || 401).json({
      success: false,
      message: 'No token provided',
    });
  }
  

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log("Decoded JWT:", decoded);
    const user = await UserModel.findByPk(decoded.id);
    if (!user) {
      return res.status(statusCode.UNAUTHORIZED || 401).json({
        success: false,
        message: 'User not found',
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(statusCode.UNAUTHORIZED || 401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
