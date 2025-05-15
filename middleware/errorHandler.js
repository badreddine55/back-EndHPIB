const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  };
  
  // Export as a named export
  module.exports = { errorHandler };