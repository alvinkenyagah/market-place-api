const { validationResult } = require('express-validator');

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path, // 'path' contains the field name in newer express-validator versions
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = validateFields;