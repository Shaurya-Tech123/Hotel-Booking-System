function notFound(_req, res) {
    res.status(404).json({ error: "Route not found" });
}

function errorHandler(err, _req, res, _next) {
    let status = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";

    // MongoDB duplicate key (username/email already exists)
    if (err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyPattern || {})[0];
        if (field === "username") message = "Username already exists";
        else if (field === "email") message = "Email already exists";
        else message = "Duplicate entry already exists";
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        status = 400;
        message = Object.values(err.errors)
            .map(e => e.message)
            .join(". ");
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        status = 401;
        message = "Invalid token";
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        status = 400;
        message = "Image must be 5MB or smaller";
    }
    if (err.message?.includes("Only JPG")) status = 400;

    res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
