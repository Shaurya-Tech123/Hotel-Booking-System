const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

function getTokenExpiry() {
    return process.env.ACCESS_TOKEN_TTL || "7d";
}

function signToken(payload) {
    const tokenPayload = {
        id: String(payload.id),
        username: payload.username,
        role: payload.role
    };
    return jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: getTokenExpiry() });
}

function verifyToken(token) {
    return jwt.verify(token, getJwtSecret());
}

module.exports = { signToken, verifyToken, getJwtSecret };
