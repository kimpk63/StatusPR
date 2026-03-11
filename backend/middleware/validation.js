// simple validation middleware
// rules is an object where each key is a field name and value is an object:
// { required: bool, type: 'string'|'number'|'boolean', validator: fn }

function validateInput(rules) {
  return (req, res, next) => {
    try {
      for (const field in rules) {
        const opts = rules[field];
        const val = req.body[field];

        if (opts.required && (val === undefined || val === null || val === '')) {
          return res.status(400).json({ error: `${field} is required` });
        }

        if (val !== undefined && val !== null) {
          if (opts.type && typeof val !== opts.type) {
            return res
              .status(400)
              .json({ error: `${field} must be a ${opts.type}` });
          }
          if (opts.validator && typeof opts.validator === 'function') {
            if (!opts.validator(val)) {
              return res.status(400).json({ error: `${field} is invalid` });
            }
          }
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

// middleware to validate uploaded file exists and meets video constraints
function validateVideoFile(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
  }
  if (!req.file.mimetype || !req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ error: 'Only video files are allowed' });
  }
  next();
}

module.exports = { validateInput, validateVideoFile };