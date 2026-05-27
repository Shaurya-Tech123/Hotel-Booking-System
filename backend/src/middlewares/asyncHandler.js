// Wraps async route handlers and forwards errors to Express error middleware
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
        if (!err.statusCode) err.statusCode = err.status || 500;
        next(err);
    });
};

module.exports = asyncHandler;
